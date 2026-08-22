import pandas as pd, numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
sns.set_style('whitegrid')
plt.rcParams['figure.dpi'] = 110

df = pd.read_csv('data/clients_clustered.csv')
OUT = 'outputs'

fig, axes = plt.subplots(1, 3, figsize=(15, 4))
sns.histplot(df['age'], bins=25, color='#2563eb', ax=axes[0])
axes[0].set_title('Age Distribution')
sns.histplot(df['total_investment'], bins=30, color='#16a34a', ax=axes[1])
axes[1].set_title('Total Investment Distribution')
axes[1].set_xlabel('Total Investment ($)')
sns.countplot(x='satisfaction_score', data=df, color='#f97316', ax=axes[2])
axes[2].set_title('Satisfaction Score Distribution')
plt.tight_layout()
plt.savefig(f'{OUT}/eda_distributions.png', bbox_inches='tight')
plt.close()

# Correlation heatmap of numeric features
num_cols = ['age','satisfaction_score','loan_applied_flag','property_count','total_investment',
            'avg_purchase_price','avg_floor_area','n_towers','office_ratio','purchase_span_days']
corr = df[num_cols].corr()
plt.figure(figsize=(8,6.5))
sns.heatmap(corr, annot=True, fmt='.2f', cmap='coolwarm', center=0, square=True, cbar_kws={'shrink':0.8})
plt.title('Correlation Matrix — Numeric Features')
plt.tight_layout()
plt.savefig(f'{OUT}/correlation_heatmap.png', bbox_inches='tight')
plt.close()

# Segment bar summary chart (clients + investment share)
seg = df.groupby('segment').agg(clients=('client_id','count'), total_investment=('total_investment','sum')).reset_index()
seg['inv_share'] = seg['total_investment']/seg['total_investment'].sum()*100
seg['client_share'] = seg['clients']/seg['clients'].sum()*100
fig, ax1 = plt.subplots(figsize=(9,5))
x = np.arange(len(seg))
w=0.35
ax1.bar(x-w/2, seg['client_share'], width=w, label='% of Clients', color='#94a3b8')
ax1.bar(x+w/2, seg['inv_share'], width=w, label='% of Total Investment', color='#2563eb')
ax1.set_xticks(x); ax1.set_xticklabels(seg['segment'], rotation=15, ha='right')
ax1.set_ylabel('Share (%)')
ax1.set_title('Segment Size vs. Investment Value Contribution')
ax1.legend()
plt.tight_layout()
plt.savefig(f'{OUT}/segment_value_share.png', bbox_inches='tight')
plt.close()

print("EDA extra plots saved")
