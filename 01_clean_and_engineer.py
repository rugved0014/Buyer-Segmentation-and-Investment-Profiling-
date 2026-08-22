"""
Step 1 & 2: Data Cleaning + Feature Engineering
Parcl Buyer Segmentation Project
"""
import pandas as pd
import numpy as np
from datetime import datetime

pd.set_option('display.max_columns', None)

RAW_CLIENTS = '/mnt/user-data/uploads/clients.csv'
RAW_PROPERTIES = '/mnt/user-data/uploads/properties.csv'
OUT_DIR = '/home/claude/project/data'

# ------------------------------------------------------------------
# LOAD
# ------------------------------------------------------------------
clients = pd.read_csv(RAW_CLIENTS)
props = pd.read_csv(RAW_PROPERTIES)

print(f"Raw clients: {clients.shape}, Raw properties: {props.shape}")

# ------------------------------------------------------------------
# CLEAN CLIENTS
# ------------------------------------------------------------------
clients = clients.drop_duplicates(subset='client_id').copy()

# normalize categorical text labels
cat_cols = ['client_type', 'gender', 'country', 'region', 'acquisition_purpose',
            'loan_applied', 'referral_channel']
for c in cat_cols:
    clients[c] = clients[c].astype(str).str.strip().str.title()
clients['gender'] = clients['gender'].str.upper()
clients['country'] = clients['country'].replace({'Usa': 'USA', 'Uk': 'UK'})

# robust mixed-format date parsing (dd-mm-yyyy AND m/d/yyyy both present)
def parse_dob(x):
    for fmt in ('%d-%m-%Y', '%m/%d/%Y', '%Y-%m-%d'):
        try:
            return datetime.strptime(x, fmt)
        except (ValueError, TypeError):
            continue
    return pd.NaT

clients['date_of_birth'] = clients['date_of_birth'].apply(parse_dob)
REF_DATE = datetime(2024, 12, 31)
clients['age'] = ((REF_DATE - clients['date_of_birth']).dt.days / 365.25).round().astype('Int64')

# drop rows where DOB failed to parse (data quality)
before = len(clients)
clients = clients.dropna(subset=['date_of_birth', 'age'])
print(f"Dropped {before - len(clients)} clients with unparseable DOB")

# sanity bounds on age
clients = clients[(clients['age'] >= 18) & (clients['age'] <= 100)]

clients['loan_applied_flag'] = (clients['loan_applied'] == 'Yes').astype(int)

# ------------------------------------------------------------------
# CLEAN PROPERTIES
# ------------------------------------------------------------------
props = props.drop_duplicates(subset='listing_id').copy()
props['unit_category'] = props['unit_category'].astype(str).str.strip().str.title()
props['listing_status'] = props['listing_status'].astype(str).str.strip().str.title()

props['sale_price_clean'] = (
    props['sale_price'].astype(str)
    .str.replace('$', '', regex=False)
    .str.replace(',', '', regex=False)
    .astype(float)
)

props['transaction_date'] = pd.to_datetime(props['transaction_date'], format='%d-%m-%Y', errors='coerce')

# ------------------------------------------------------------------
# CLIENT-LEVEL TRANSACTION AGGREGATION (Step 2 setup: engineered behavioral features)
# ------------------------------------------------------------------
sold = props[props['listing_status'] == 'Sold'].dropna(subset=['client_ref'])

agg = sold.groupby('client_ref').agg(
    property_count=('listing_id', 'count'),
    total_investment=('sale_price_clean', 'sum'),
    avg_purchase_price=('sale_price_clean', 'mean'),
    max_purchase_price=('sale_price_clean', 'max'),
    avg_floor_area=('floor_area_sqft', 'mean'),
    total_floor_area=('floor_area_sqft', 'sum'),
    n_towers=('tower_number', pd.Series.nunique),
    n_apartments=('unit_category', lambda x: (x == 'Apartment').sum()),
    n_offices=('unit_category', lambda x: (x == 'Office').sum()),
    first_purchase=('transaction_date', 'min'),
    last_purchase=('transaction_date', 'max'),
).reset_index().rename(columns={'client_ref': 'client_id'})

agg['office_ratio'] = (agg['n_offices'] / agg['property_count']).round(3)
agg['purchase_span_days'] = (agg['last_purchase'] - agg['first_purchase']).dt.days.fillna(0)

# ------------------------------------------------------------------
# MERGE -> client_features
# ------------------------------------------------------------------
features = clients.merge(agg, on='client_id', how='left')

# clients present but with zero sold transactions -> fill 0 (still valid buyers/leads)
num_fill_cols = ['property_count', 'total_investment', 'avg_purchase_price', 'max_purchase_price',
                  'avg_floor_area', 'total_floor_area', 'n_towers', 'n_apartments', 'n_offices',
                  'office_ratio', 'purchase_span_days']
for c in num_fill_cols:
    features[c] = features[c].fillna(0)

before = len(features)
features = features[features['property_count'] > 0].copy()
print(f"Kept {len(features)} of {before} clients that have at least one completed sale (needed for investment profiling)")

features.to_csv(f'{OUT_DIR}/clients_clean.csv', index=False)
props.to_csv(f'{OUT_DIR}/properties_clean.csv', index=False)
features.to_csv(f'{OUT_DIR}/client_features.csv', index=False)

print("\nFinal feature table shape:", features.shape)
print(features.dtypes)
print("\nSample:")
print(features.head(3))
