# Buyer Segmentation & Investment Profiling Dashboard

This repository contains the Machine Learning pipeline and Streamlit dashboard for real estate buyer segmentation and investment profiling, developed for **Parcl Co. Limited × Unified Mentor**.

The project uses K-Means clustering ($k=4$), validated against Hierarchical clustering, to segment real estate clients based on their financing behavior, deal size, portfolio depth, and buying window.

---

## Installation & Setup

### 1. Prerequisites
Ensure you have Python 3.8+ installed on your system.

### 2. Install Dependencies
Run the following command to install the required Python packages:

```bash
pip install pandas numpy matplotlib seaborn scikit-learn scipy streamlit plotly
```

---

## How to Run the Dashboard

The Streamlit dashboard allows interactive visualization of the buyer segments and profiling insights. To run the app, execute the following command in the project root directory:

```bash
streamlit run streamlit_app.py
```

After running the command, the dashboard will open automatically in your default browser at:
`http://localhost:8501`

---

## Project Structure

```text
Buyer-Segmentation-and-Investment-Profiling/
├── streamlit_app.py             # Streamlit Dashboard application
├── 01_clean_and_engineer.py     # Step 1-2: Data cleaning and feature engineering
├── 02_clustering.py             # Step 3-6: Scaling, clustering model (K-Means/Hierarchical), evaluation, labeling
├── 03_eda_extra.py              # Additional EDA plotting scripts
├── build_report.js              # Word research report generation script (requires Node.js)
├── data/
│   ├── client_features.csv      # Cleaned and engineered client-level features
│   └── clients_clustered.csv    # Final dataset with cluster & segment labels
└── outputs/
    ├── Buyer_Segmentation_Research_Report.docx  # Generated research report
    ├── cluster_profile.csv                       # Summary metrics per segment
    ├── clustering_summary.txt                    # Model validation metrics
    └── *.png                                     # Diagnostic and EDA charts
```

---

## Running the Data & ML Pipeline

If you wish to re-run or modify the analysis pipeline, execute the scripts in the following order:

```bash
# 1. Clean data and engineer features
python 01_clean_and_engineer.py

# 2. Run feature scaling, clustering, and save output metrics/plots
python 02_clustering.py

# 3. Generate additional EDA visualizations
python 03_eda_extra.py
```

*Note: The datasets `data/clients_clustered.csv` and `outputs/cluster_profile.csv` are already populated by default, so you only need to run these scripts if you modify the underlying pipeline.*

---

## Buyer Segments Summary

The client base is divided into four distinct segments:

| Segment | Share (%) | Key Characteristics | Playbook Action |
| :--- | :--- | :--- | :--- |
| **High-Net-Worth Investors** | 4.1% | High-value portfolios, oldest age profile, repeat buyers, cash buyers. | White-glove management, priority inventory access. |
| **Premium / Global Investors** | 33.2% | Buy high-end properties (highest average price per deal), office skew. | Target with high-end office/retail listings & ROI models. |
| **Mainstream Buyers** | 45.4% | Largest segment, average deal size, lowest satisfaction scores. | Focus CX resources here to mitigate churn and improve satisfaction. |
| **First-Time Buyers** | 17.4% | Youngest, highly loan-dependent, rapid single-purchase window (~6 days). | Financing partnerships, first-time-buyer incentives. |

---
*Parcl Co. Limited × Unified Mentor — Real Estate Market Intelligence*
