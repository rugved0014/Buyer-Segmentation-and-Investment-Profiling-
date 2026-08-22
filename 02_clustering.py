"""
Step 3, 4, 5: Feature Scaling + Clustering Model Selection + Optimal Cluster Selection
Parcl Buyer Segmentation Project
"""
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.cluster import KMeans, AgglomerativeClustering
from sklearn.metrics import silhouette_score, silhouette_samples, davies_bouldin_score
from sklearn.decomposition import PCA
from scipy.cluster.hierarchy import dendrogram, linkage

sns.set_style('whitegrid')
plt.rcParams['figure.dpi'] = 110

DATA_DIR = '/home/claude/project/data'
OUT_DIR = '/home/claude/project/outputs'

df = pd.read_csv(f'{DATA_DIR}/client_features.csv')
print("Loaded features:", df.shape)

# ------------------------------------------------------------------
# Step 2 (cont.): Feature Encoding
# ------------------------------------------------------------------
categorical_features = ['client_type', 'gender', 'country', 'region',
                         'acquisition_purpose', 'referral_channel']
binary_features = ['loan_applied_flag']
numeric_features = ['age', 'satisfaction_score', 'property_count', 'total_investment',
                     'avg_purchase_price', 'avg_floor_area', 'n_towers', 'office_ratio',
                     'purchase_span_days']

X_cat = pd.get_dummies(df[categorical_features], prefix=categorical_features)
X_num = df[numeric_features + binary_features].copy()

# ------------------------------------------------------------------
# Step 3: Feature Scaling (numeric only; one-hot stays 0/1)
# ------------------------------------------------------------------
scaler = StandardScaler()
X_num_scaled = pd.DataFrame(scaler.fit_transform(X_num), columns=X_num.columns, index=df.index)

X = pd.concat([X_num_scaled, X_cat.astype(float)], axis=1)
print("Model matrix shape:", X.shape)

# ------------------------------------------------------------------
# Step 5: Optimal Cluster Selection — Elbow + Silhouette (evaluated together)
# ------------------------------------------------------------------
K_RANGE = range(2, 11)
inertias, sil_scores, dbi_scores = [], [], []

for k in K_RANGE:
    km = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = km.fit_predict(X)
    inertias.append(km.inertia_)
    sil_scores.append(silhouette_score(X, labels))
    dbi_scores.append(davies_bouldin_score(X, labels))

fig, axes = plt.subplots(1, 2, figsize=(13, 4.5))
axes[0].plot(list(K_RANGE), inertias, marker='o', color='#2563eb')
axes[0].set_title('Elbow Method — Inertia vs k')
axes[0].set_xlabel('Number of clusters (k)')
axes[0].set_ylabel('Inertia (WCSS)')
axes[0].axvline(4, color='crimson', linestyle='--', alpha=0.6, label='Chosen k=4')
axes[0].legend()

axes[1].plot(list(K_RANGE), sil_scores, marker='o', color='#16a34a')
axes[1].set_title('Silhouette Score vs k')
axes[1].set_xlabel('Number of clusters (k)')
axes[1].set_ylabel('Average Silhouette Score')
axes[1].axvline(4, color='crimson', linestyle='--', alpha=0.6, label='Chosen k=4')
axes[1].legend()
plt.tight_layout()
plt.savefig(f'{OUT_DIR}/elbow_silhouette.png', bbox_inches='tight')
plt.close()

print("\nk | inertia | silhouette | davies-bouldin")
for k, i, s, d in zip(K_RANGE, inertias, sil_scores, dbi_scores):
    print(f"{k} | {i:.1f} | {s:.4f} | {d:.4f}")

best_k_by_sil = list(K_RANGE)[int(np.argmax(sil_scores))]
print(f"\nBest k by silhouette: {best_k_by_sil}")

# Business requirement calls for 4 segments (Global Investors, First-Time Buyers,
# Corporate Buyers, Luxury Investors) -- k=4 also sits at/near the silhouette peak
# among interpretable options, so we lock k=4 for the production model.
K_FINAL = 4

# ------------------------------------------------------------------
# Step 4: Clustering Model Selection — K-Means (production) + Hierarchical (validation)
# ------------------------------------------------------------------
kmeans_final = KMeans(n_clusters=K_FINAL, random_state=42, n_init=25)
df['cluster_kmeans'] = kmeans_final.fit_predict(X)
kmeans_sil = silhouette_score(X, df['cluster_kmeans'])
print(f"\nFinal K-Means (k={K_FINAL}) silhouette: {kmeans_sil:.4f}")

# Hierarchical clustering (Ward linkage) for validation
agglo = AgglomerativeClustering(n_clusters=K_FINAL, linkage='ward')
df['cluster_hier'] = agglo.fit_predict(X)
hier_sil = silhouette_score(X, df['cluster_hier'])
print(f"Hierarchical (k={K_FINAL}) silhouette: {hier_sil:.4f}")

# Agreement between the two methods (Adjusted Rand Index)
from sklearn.metrics import adjusted_rand_score
ari = adjusted_rand_score(df['cluster_kmeans'], df['cluster_hier'])
print(f"Agreement between K-Means and Hierarchical (ARI): {ari:.4f}")

# Dendrogram on a sample (full 2000-point dendrogram is unreadable)
sample_idx = np.random.RandomState(42).choice(len(X), size=150, replace=False)
Z = linkage(X.iloc[sample_idx], method='ward')
plt.figure(figsize=(12, 5))
dendrogram(Z, no_labels=True, color_threshold=None)
plt.title('Hierarchical Clustering Dendrogram (150-client sample, Ward linkage)')
plt.xlabel('Clients')
plt.ylabel('Distance')
plt.tight_layout()
plt.savefig(f'{OUT_DIR}/dendrogram.png', bbox_inches='tight')
plt.close()

# ------------------------------------------------------------------
# PCA visualization of clusters
# ------------------------------------------------------------------
pca = PCA(n_components=2, random_state=42)
coords = pca.fit_transform(X)
df['pca1'], df['pca2'] = coords[:, 0], coords[:, 1]
print(f"PCA explained variance: {pca.explained_variance_ratio_.sum():.2%}")

plt.figure(figsize=(8, 6))
palette = sns.color_palette('Set2', K_FINAL)
sns.scatterplot(x='pca1', y='pca2', hue='cluster_kmeans', data=df, palette=palette, s=35, alpha=0.75)
plt.title(f'Buyer Segments in PCA Space (k={K_FINAL})')
plt.xlabel(f'PC1 ({pca.explained_variance_ratio_[0]:.1%} var)')
plt.ylabel(f'PC2 ({pca.explained_variance_ratio_[1]:.1%} var)')
plt.legend(title='Cluster')
plt.tight_layout()
plt.savefig(f'{OUT_DIR}/pca_clusters.png', bbox_inches='tight')
plt.close()

# Silhouette diagram
sil_vals = silhouette_samples(X, df['cluster_kmeans'])
plt.figure(figsize=(8, 6))
y_lower = 10
for i in range(K_FINAL):
    vals = sil_vals[df['cluster_kmeans'] == i]
    vals.sort()
    y_upper = y_lower + len(vals)
    plt.fill_betweenx(np.arange(y_lower, y_upper), 0, vals, facecolor=palette[i], alpha=0.8)
    plt.text(-0.05, y_lower + 0.5 * len(vals), str(i))
    y_lower = y_upper + 10
plt.axvline(kmeans_sil, color='red', linestyle='--', label=f'Avg = {kmeans_sil:.3f}')
plt.title('Silhouette Plot per Cluster')
plt.xlabel('Silhouette coefficient')
plt.ylabel('Cluster')
plt.legend()
plt.tight_layout()
plt.savefig(f'{OUT_DIR}/silhouette_plot.png', bbox_inches='tight')
plt.close()

# ------------------------------------------------------------------
# Step 6: Cluster Interpretation
# ------------------------------------------------------------------
profile = df.groupby('cluster_kmeans').agg(
    n_clients=('client_id', 'count'),
    avg_age=('age', 'mean'),
    pct_investment_purpose=('acquisition_purpose', lambda x: (x == 'Investment').mean() * 100),
    pct_corporate=('client_type', lambda x: (x == 'Company').mean() * 100),
    pct_loan=('loan_applied_flag', 'mean'),
    avg_satisfaction=('satisfaction_score', 'mean'),
    avg_property_count=('property_count', 'mean'),
    avg_total_investment=('total_investment', 'mean'),
    avg_purchase_price=('avg_purchase_price', 'mean'),
    avg_floor_area=('avg_floor_area', 'mean'),
    avg_purchase_span_days=('purchase_span_days', 'mean'),
).round(2)
profile['pct_loan'] = (profile['pct_loan'] * 100).round(1)
print("\n=== CLUSTER PROFILE ===")
print(profile)

# IMPORTANT DATA FINDING: client_type (corporate share) and country mix are
# essentially uniform across all four clusters (~5% corporate in every cluster,
# similar country mix). Demographic/categorical fields do NOT differentiate
# buyers here -- the clustering is driven almost entirely by BEHAVIORAL and
# FINANCIAL variables (deal size, unit price/size, financing, tenure, age).
# We therefore name segments from what actually separates them rather than
# forcing an artificial "Corporate Buyers" label onto a cluster with no
# elevated corporate share.
def label_clusters(profile):
    inv_rank = profile['avg_total_investment'].rank(ascending=False)          # 1 = highest $
    price_rank = profile['avg_purchase_price'].rank(ascending=False)          # 1 = priciest per unit
    loan_rank = profile['pct_loan'].rank(ascending=False)                     # 1 = most loan-dependent
    span_rank = profile['avg_purchase_span_days'].rank(ascending=True)        # 1 = shortest/newest relationship

    labels = {}
    for c in profile.index:
        if inv_rank[c] == 1 and profile.loc[c, 'avg_property_count'] == profile['avg_property_count'].max():
            labels[c] = 'High-Net-Worth Investors'      # biggest wallet, most repeat purchases, low financing
        elif price_rank[c] == 1:
            labels[c] = 'Premium / Global Investors'    # fewer deals but priciest, largest units per deal
        elif span_rank[c] == 1 and loan_rank[c] <= 2:
            labels[c] = 'First-Time Buyers'             # youngest, most loan-dependent, single rapid purchase
        else:
            labels[c] = 'Mainstream Buyers'             # largest group, average deal size, lowest satisfaction
    return labels

cluster_names = label_clusters(profile)
print("\nCluster name mapping:", cluster_names)
print("\nNOTE: pct_corporate and country mix are near-uniform across clusters")
print("(see profile above) -- categorical demographics are not the drivers of")
print("segmentation here; financial/behavioral variables are.")

df['segment'] = df['cluster_kmeans'].map(cluster_names)
profile['segment_name'] = profile.index.map(cluster_names)

df.to_csv(f'{DATA_DIR}/clients_clustered.csv', index=False)
profile.to_csv(f'{OUT_DIR}/cluster_profile.csv')

with open(f'{OUT_DIR}/clustering_summary.txt', 'w') as f:
    f.write(f"Final model: K-Means, k={K_FINAL}\n")
    f.write(f"Silhouette (K-Means): {kmeans_sil:.4f}\n")
    f.write(f"Silhouette (Hierarchical): {hier_sil:.4f}\n")
    f.write(f"ARI agreement K-Means vs Hierarchical: {ari:.4f}\n")
    f.write(f"PCA variance explained (2D): {pca.explained_variance_ratio_.sum():.2%}\n\n")
    f.write("Cluster name mapping:\n")
    for c, n in cluster_names.items():
        f.write(f"  Cluster {c} -> {n}\n")
    f.write("\n")
    f.write(profile.to_string())

print("\nSaved: clients_clustered.csv, cluster_profile.csv, plots, clustering_summary.txt")
