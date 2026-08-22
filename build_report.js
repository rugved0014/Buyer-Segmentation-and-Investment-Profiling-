const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, AlignmentType, ImageRun, PageBreak, BorderStyle,
  TableOfContents, LevelFormat, convertInchesToTwip, VerticalAlign, PageOrientation
} = require("docx");

const IMG = "/home/claude/project/outputs";

function img(path, widthIn, heightIn) {
  return new ImageRun({
    type: "png",
    data: fs.readFileSync(path),
    transformation: { width: convertInchesToTwip(widthIn) / 15, height: convertInchesToTwip(heightIn) / 15 },
  });
}
// docx-js ImageRun transformation expects pixels, not twips. Use simple px sizing helper instead.
function imgPx(path, wPx, hPx) {
  return new ImageRun({ type: "png", data: fs.readFileSync(path), transformation: { width: wPx, height: hPx } });
}

const NAVY = "1E293B";
const BLUE = "2563EB";
const GRAY = "64748B";

function h1(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } });
}
function h2(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 } });
}
function p(text, opts = {}) {
  return new Paragraph({ children: [new TextRun({ text, ...opts })], spacing: { after: 160 }, alignment: AlignmentType.JUSTIFIED });
}
function bullet(text) {
  return new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 80 } });
}
function caption(text) {
  return new Paragraph({
    children: [new TextRun({ text, italics: true, size: 18, color: GRAY })],
    alignment: AlignmentType.CENTER, spacing: { after: 300 },
  });
}
function centerImg(pathfile, wPx, hPx, cap, breakBefore) {
  const nodes = [
    new Paragraph({
      children: [imgPx(pathfile, wPx, hPx)],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 80, line: 240, lineRule: "auto" },
      keepLines: true,
    }),
  ];
  if (cap) nodes.push(caption(cap));
  return nodes;
}

function cell(text, opts = {}) {
  return new TableCell({
    width: { size: opts.width || 2000, type: WidthType.DXA },
    shading: opts.header ? { type: ShadingType.CLEAR, fill: NAVY } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: String(text), bold: !!opts.header, color: opts.header ? "FFFFFF" : "000000", size: 20 })],
    })],
  });
}

function dataTable(headers, rows, widths) {
  const headerRow = new TableRow({ children: headers.map((hd, i) => cell(hd, { header: true, width: widths[i] })), tableHeader: true });
  const bodyRows = rows.map((r, ri) => new TableRow({
    children: r.map((v, i) => cell(v, { width: widths[i] })),
  }));
  return new Table({ width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: widths, rows: [headerRow, ...bodyRows] });
}

const clusterHeaders = ["Segment", "Clients", "Avg\nAge", "%\nInvestment", "%\nLoan", "Avg\nSatisf.", "Avg Total\nInvestment", "Avg Purchase\nPrice", "Avg Buying\nWindow (d)"];
const clusterRows = [
  ["High-Net-Worth Investors", "81 (4.1%)", "62.98", "25.9%", "36.0%", "3.52", "$2,140,245", "$335,609", "357.9"],
  ["Premium / Global Investors", "664 (33.2%)", "54.25", "30.0%", "36.0%", "3.08", "$1,480,485", "$421,254", "328.5"],
  ["Mainstream Buyers", "907 (45.4%)", "54.82", "31.3%", "37.0%", "2.96", "$1,087,334", "$301,911", "368.8"],
  ["First-Time Buyers", "348 (17.4%)", "52.75", "31.9%", "39.0%", "2.99", "$1,086,601", "$326,004", "6.3"],
];
const colWidths = [2000, 750, 650, 900, 850, 850, 1150, 1050, 950];

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { line: 276 } } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, color: NAVY }, paragraph: { spacing: { before: 400, after: 200 }, border: { bottom: { color: BLUE, space: 4, style: BorderStyle.SINGLE, size: 6 } } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, color: BLUE }, paragraph: { spacing: { before: 300, after: 150 } } },
    ],
  },
  sections: [
    // ---------------- TITLE PAGE ----------------
    {
      properties: { page: { size: { width: 12240, height: 15840 } } },
      children: [
        new Paragraph({ text: "", spacing: { before: 1600 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Machine Learning–Based Buyer Segmentation and", bold: true, size: 40, color: NAVY })],
          spacing: { after: 120 },
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Investment Profiling for Real Estate Market Intelligence", bold: true, size: 40, color: NAVY })],
          spacing: { after: 400 },
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "A K-Means & Hierarchical Clustering Study of Parcl Buyer Behavior", italics: true, size: 26, color: GRAY })],
          spacing: { after: 800 },
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Prepared for", size: 22, color: GRAY })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Parcl Co. Limited  ×  Unified Mentor", bold: true, size: 26 })], spacing: { after: 800 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Domain: Financial Analytics & Real Estate Market Intelligence", size: 22, color: GRAY })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "August 2026", size: 22, color: GRAY })], spacing: { after: 1600 } }),
        new Paragraph({ children: [new PageBreak()] }),

        // ---------------- ABSTRACT ----------------
        h1("Abstract"),
        p("Parcl Co. Limited sells residential and commercial units across a multi-tower development but has historically treated all buyers uniformly, leading to generic marketing, weak investor targeting, and missed opportunities to prioritize high-value relationships. This study applies unsupervised machine learning to 2,000 buyer profiles linked to 7,305 completed unit sales to uncover natural buyer segments and translate them into an operational investment-profiling framework."),
        p("After cleaning and merging client and transaction records, we engineered financial and behavioral features — total investment, per-deal price, portfolio depth, financing use, and buying tenure — alongside demographic attributes. K-Means clustering (k = 4, chosen via the elbow method and silhouette analysis) was cross-validated against Ward-linkage Hierarchical clustering (Adjusted Rand Index = 0.25, directionally consistent). The resulting segments — High-Net-Worth Investors, Premium/Global Investors, Mainstream Buyers, and First-Time Buyers — differ sharply on deal size, financing dependency, and buying tenure, while demographic fields such as client type and country show little separating power. A companion Streamlit dashboard operationalizes these segments for Parcl's marketing and investor-relations teams."),
        new Paragraph({ children: [new PageBreak()] }),

        // ---------------- TOC ----------------
        h1("Table of Contents"),
        p("1. Introduction & Problem Statement"),
        p("2. Dataset Description"),
        p("3. Data Science Methodology"),
        p("4. Exploratory Data Analysis"),
        p("5. Cluster Results & Segment Interpretation"),
        p("6. Business Recommendations"),
        p("7. Streamlit Dashboard"),
        p("8. Conclusion & Future Work"),
        new Paragraph({ children: [new PageBreak()] }),

        // ---------------- 1. INTRODUCTION ----------------
        h1("1. Introduction & Problem Statement"),
        p("Real estate buyers form a highly heterogeneous population — individual home buyers, institutional and corporate investors, international purchasers, high-net-worth individuals, and first-time buyers all transact through the same sales channels but with fundamentally different needs, risk appetites, and financing behavior. Without a data-driven way to tell these groups apart, Parcl faces three recurring problems:"),
        bullet("Inefficient marketing spend — the same messaging and channel mix is used for buyers with very different motivations."),
        bullet("Generic property recommendations that do not match a buyer's actual purchasing pattern (deal size, unit type, financing need)."),
        bullet("Poor investor targeting — high-value or repeat-purchase clients are not systematically identified or prioritized for relationship management."),
        p("This project addresses these problems with an unsupervised machine learning pipeline that discovers hidden buyer segments directly from transaction and client data, profiles each segment's investment behavior, and exposes the result through an interactive analytics dashboard for day-to-day use by Parcl's marketing and sales teams."),

        h2("1.1 Objectives"),
        bullet("Clean and unify Parcl's client and property-transaction data into a single analysis-ready table."),
        bullet("Engineer behavioral and financial features that describe how each client actually transacts, not just who they are."),
        bullet("Apply and compare K-Means and Hierarchical clustering to identify natural buyer segments."),
        bullet("Select the optimal number of clusters using the Elbow Method and Silhouette Score."),
        bullet("Interpret each segment's investment purpose, geographic distribution, financing behavior, and demographics."),
        bullet("Deliver the results as a live Streamlit dashboard with filterable views for country, region, acquisition purpose, and client type."),

        // ---------------- 2. DATASET ----------------
        h1("2. Dataset Description"),
        p("Two source datasets were provided:"),
        bullet("clients.csv — 2,000 unique buyer records with client_type, gender, country, region, date_of_birth, acquisition_purpose, loan_applied, referral_channel, and satisfaction_score."),
        bullet("properties.csv — 10,000 unit listings across 20 towers, spanning transactions from 1 Jan 2024 to 12 Jan 2025, of which 7,305 are marked Sold and linked to a client via client_ref; the remaining listings are still Available and were excluded from buyer profiling."),
        p("Every one of the 2,000 clients had at least one completed (Sold) transaction, so the full client base was retained for segmentation — no clients were dropped for lack of transaction history."),

        h2("2.1 Feature Dictionary"),
        dataTable(
          ["Feature", "Description", "Role"],
          [
            ["client_type", "Individual or Company", "Categorical (encoded)"],
            ["gender, country, region", "Buyer demographics", "Categorical (encoded)"],
            ["age (derived)", "Computed from date_of_birth", "Numeric (scaled)"],
            ["acquisition_purpose", "Home vs. Investment", "Categorical (encoded)"],
            ["loan_applied", "Financing indicator", "Binary"],
            ["referral_channel", "Website / Agency / Client referral", "Categorical (encoded)"],
            ["satisfaction_score", "1–5 customer rating", "Numeric (scaled)"],
            ["property_count, total_investment,\navg_purchase_price, avg_floor_area,\npurchase_span_days (engineered)", "Aggregated from linked property sales", "Numeric (scaled)"],
          ],
          [2500, 4500, 2200]
        ),

        // ---------------- 3. METHODOLOGY ----------------
        h1("3. Data Science Methodology"),

        h2("3.1 Data Cleaning"),
        bullet("Removed duplicate client and listing records (none found beyond the primary key)."),
        bullet("Normalized inconsistent categorical casing (e.g., 'usa' / 'USA' / 'Usa' → 'USA')."),
        bullet("Parsed date_of_birth despite two co-existing date formats in the raw file (DD-MM-YYYY and M/D/YYYY) using a fallback multi-format parser, then derived age as of the analysis reference date."),
        bullet("Stripped currency formatting ('$300,385.62' → 300385.62) from sale_price and parsed transaction_date to datetime."),
        bullet("Filtered property records to listing_status = 'Sold' before aggregating client-level investment behavior, since Available (unsold) units carry no buyer signal."),

        h2("3.2 Feature Engineering & Encoding"),
        p("Beyond the raw client attributes, we engineered behavioral features by aggregating each client's completed transactions: number of properties owned, total and average investment, largest single purchase, average and total floor area, number of distinct towers purchased in, office-vs-apartment mix, and the buying-window (days between first and last purchase) — a proxy for whether a client is a long-tenured repeat buyer or a brand-new single-session purchaser."),
        p("Categorical variables (client_type, gender, country, region, acquisition_purpose, referral_channel) were one-hot encoded; loan_applied was label-encoded to a binary flag. This produced an 86-dimensional model matrix from the original 12 raw fields."),

        h2("3.3 Feature Scaling"),
        p("All numeric features (age, satisfaction_score, property_count, total_investment, avg_purchase_price, avg_floor_area, n_towers, office_ratio, purchase_span_days) were standardized with scikit-learn's StandardScaler (zero mean, unit variance) before clustering, so that high-magnitude fields such as total_investment could not dominate the distance metric used by K-Means and Hierarchical clustering."),

        h2("3.4 Clustering Model Selection"),
        p("Two complementary clustering approaches were evaluated:"),
        bullet("K-Means Clustering — fast, scalable, and easy to interpret; selected as the production model."),
        bullet("Hierarchical (Agglomerative, Ward linkage) Clustering — used to independently validate the K-Means structure and to visualize nested buyer relationships via a dendrogram."),

        h2("3.5 Optimal Cluster Selection"),
        p("We swept k from 2 to 10 and evaluated each value with the Elbow Method (inertia / within-cluster sum of squares) and the average Silhouette Score. Silhouette peaked at k = 3 (0.129) with k = 4 essentially tied (0.124), while inertia showed a visible bend around k = 4. Because the business requirement calls for a small set of actionable, interpretable investor personas — and k = 4 sits at the elbow while remaining statistically competitive with the silhouette-optimal k = 3 — we locked the production model at k = 4."),
        ...centerImg(`${IMG}/elbow_silhouette.png`, 600, 204, "Figure 1. Elbow Method (left) and Silhouette Score (right) across k = 2..10. k = 4 chosen.", false),

        p("The final K-Means model (k = 4) achieved a silhouette score of 0.124; Ward-linkage Hierarchical clustering on the same feature matrix achieved 0.082 at k = 4. Agreement between the two methods, measured with the Adjusted Rand Index, was 0.25 — indicating the two algorithms broadly agree on cluster structure while each captures somewhat different boundary detail, which is expected given their different linkage assumptions. K-Means was retained as the production/deployment model for its stability and interpretability; Hierarchical clustering served its intended role as an independent structural check."),
        ...centerImg(`${IMG}/dendrogram.png`, 600, 247, "Figure 2. Ward-linkage dendrogram on a 150-client sample, illustrating nested cluster structure.", false),
        ...centerImg(`${IMG}/silhouette_plot.png`, 400, 299, "Figure 3. Per-cluster silhouette diagram for the final K-Means model (k = 4).", false),

        h2("3.6 Dimensionality Reduction for Visualization"),
        p("A 2-component PCA projection (38.5% cumulative variance explained) was used purely for visualization of the 86-dimensional cluster structure, not for clustering itself."),
        ...centerImg(`${IMG}/pca_clusters.png`, 400, 299, "Figure 4. Buyer segments projected into 2D PCA space.", false),

        new Paragraph({ children: [new PageBreak()] }),

        // ---------------- 4. EDA ----------------
        h1("4. Exploratory Data Analysis"),
        p(`The client base spans ${`10 countries and 57 distinct regions`}, with a combined transaction value of $2.52 billion across the 2,000 buyers. Age, investment size, and satisfaction all show broad, realistic spreads with no extreme outlier concentration.`),
        ...centerImg(`${IMG}/eda_distributions.png`, 600, 157, "Figure 5. Distributions of buyer age, total investment, and satisfaction score.", false),
        ...centerImg(`${IMG}/correlation_heatmap.png`, 400, 366, "Figure 6. Correlation matrix of numeric client and transaction features.", false),
        p("Two correlation patterns stand out. First, total_investment correlates strongly with property_count and avg_purchase_price, confirming that deal volume and deal size are the primary axes of financial differentiation among buyers. Second, none of the numeric features correlate meaningfully with loan_applied_flag or satisfaction_score, suggesting financing decisions and satisfaction are driven by factors outside this dataset (e.g., service quality, external credit conditions) rather than by deal size or age."),

        // ---------------- 5. RESULTS ----------------
        new Paragraph({ children: [new PageBreak()] }),
        h1("5. Cluster Results & Segment Interpretation"),
        p("The table below summarizes the four buyer segments discovered by the final K-Means model, ordered by relative investment scale."),
        dataTable(clusterHeaders, clusterRows.map(r => r), colWidths),
        new Paragraph({ text: "", spacing: { after: 200 } }),
        ...centerImg(`${IMG}/segment_value_share.png`, 500, 275, "Figure 7. Each segment's share of clients vs. its share of total investment value.", false),

        h2("5.1 An Important Finding: Demographics Do Not Drive Segmentation"),
        p("Corporate-client share (4.8%–6.3%) and country/region mix are nearly identical across all four clusters — client_type, country, and gender carry almost no separating power in this dataset. The clustering is driven almost entirely by financial and behavioral variables: how much a client spends, how large their individual deals are, whether they finance with a loan, and how long they take to build their portfolio. This is a meaningful finding in its own right: Parcl's buyer segmentation strategy should be built around transaction behavior, not static demographic profiles."),

        h2("5.2 Segment Profiles"),
        h2("High-Net-Worth Investors (81 clients, 4.1%)"),
        p("The smallest but wealthiest segment: oldest average age (63), highest average total investment ($2.14M), and the deepest property portfolios (6.4 units/client on average), built up over a long buying window (358 days) with below-average reliance on financing. This group contributes 15% of total investment value from only 4% of the client base."),
        h2("Premium / Global Investors (664 clients, 33.2%)"),
        p("The largest single price-per-deal segment: highest average purchase price ($421k) and largest average unit footprint (1,379 sqft), consistent with a tilt toward premium and office-category units. A substantial third of Parcl's client base, contributing 39% of total investment."),
        h2("Mainstream Buyers (907 clients, 45.4%)"),
        p("Parcl's largest segment by far — nearly half of all clients — with average deal size and financing behavior, but the lowest average satisfaction score (2.96/5) of any segment. Because of its sheer size, this group still accounts for 39% of total investment value despite below-average per-client spend."),
        h2("First-Time Buyers (348 clients, 17.4%)"),
        p("The youngest segment (avg. age 53) with the highest loan-financing rate (39%) and, most distinctively, an average buying window of just 6.3 days — versus 328–369 days for every other segment. These clients purchased their entire (small) portfolio in a single rapid session, marking them as genuinely new entrants to the Parcl platform rather than long-term relationship holders."),

        new Paragraph({ children: [new PageBreak()] }),

        // ---------------- 6. RECOMMENDATIONS ----------------
        h1("6. Business Recommendations"),
        h2("6.1 High-Net-Worth Investors"),
        bullet("Assign dedicated relationship managers and priority/off-market inventory access."),
        bullet("De-prioritize loan-product marketing — this group self-finances."),
        bullet("Protect this segment first: 4% of clients drive 15% of investment value."),
        h2("6.2 Premium / Global Investors"),
        bullet("Lead with premium and office-category listings and investment-grade ROI messaging."),
        bullet("Cross-sell portfolio diversification (multiple towers, mixed unit types)."),
        h2("6.3 Mainstream Buyers"),
        bullet("Priority segment for customer-experience investment — largest group and lowest satisfaction score in the portfolio."),
        bullet("Run root-cause research (service touchpoints, pricing perception) given its outsized 39% share of total investment value."),
        h2("6.4 First-Time Buyers"),
        bullet("Build financing partnerships and first-time-buyer incentive programs given the 39% loan-usage rate."),
        bullet("Nurture campaigns aimed at converting a single rapid purchase into a repeat, long-tenure relationship."),

        // ---------------- 7. DASHBOARD ----------------
        h1("7. Streamlit Dashboard"),
        p("The segmentation output is operationalized in a live Streamlit application (app/app.py) with four modules matching Parcl's requirements, plus sidebar filters for country, region, acquisition purpose, client type, and segment:"),
        bullet("Buyer Segmentation Overview — cluster distribution (pie chart), PCA scatter of segments, and each segment's share of clients vs. investment value."),
        bullet("Investor Behavior Dashboard — investment and deal-size distributions, financing dependency, acquisition-purpose mix, and referral-channel effectiveness, all broken out by segment."),
        bullet("Geographic Buyer Analysis — segment composition by country, investment totals by country, a region-level detail table, and a country → region → segment treemap."),
        bullet("Segment Insights Panel — full descriptive-statistics table per segment, a written segment playbook, and a searchable/sortable client-level explorer."),

        // ---------------- 8. CONCLUSION ----------------
        h1("8. Conclusion & Future Work"),
        p("This project replaces Parcl's undifferentiated view of its buyer base with four statistically grounded, behaviorally distinct segments — High-Net-Worth Investors, Premium/Global Investors, Mainstream Buyers, and First-Time Buyers — validated across two independent clustering algorithms. The clearest actionable insight is that transaction behavior (deal size, financing use, buying tenure), not demographics, is what actually separates Parcl's buyers, and the accompanying dashboard puts that insight directly into the hands of marketing and investor-relations teams."),
        p("Future iterations could extend this work by: (1) incorporating time-series purchase sequences to detect segment migration over a client's lifecycle; (2) adding external data such as macroeconomic or local-market indicators to enrich the 'Global Investors' geographic signal; (3) testing density-based methods (e.g., DBSCAN/HDBSCAN) to detect non-convex segments or outlier buyer archetypes that K-Means and Ward-linkage Hierarchical clustering may smooth over; and (4) building a supervised early-warning model that predicts, at first contact, which segment a new lead is likely to fall into."),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("/home/claude/project/outputs/Buyer_Segmentation_Research_Report.docx", buf);
  console.log("Report written.");
});
