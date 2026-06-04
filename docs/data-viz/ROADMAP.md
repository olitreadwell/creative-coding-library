# Data-Viz Roadmap

Leveled curriculum by data-shape and viz pairing.

## L1 — single-series basics

| Suggested slug       | Data shape                 | Encoding              |
| -------------------- | -------------------------- | --------------------- |
| `owid-co2-line`      | Time series, one country   | Line chart (Plot)     |
| `worldbank-bar`      | Categorical, one indicator | Horizontal bar (Plot) |
| `nz-temp-area`       | Time series, stacked       | Area chart (Plot)     |
| `gh-contrib-heatmap` | 2D grid, one value         | Heatmap (Plot)        |

## L2 — multi-series + interaction

| Suggested slug             | Data shape                | Encoding                           |
| -------------------------- | ------------------------- | ---------------------------------- |
| `tfl-arrivals-flow`        | Time + geo, live          | Animated dot map (d3 + Canvas)     |
| `census-scatter`           | Multi-attribute           | Scatter w/ brushable filter (Visx) |
| `eurostat-small-multiples` | Time series × N countries | Small multiples grid (Plot)        |
| `osm-density`              | Geo, tile                 | Choropleth (d3-geo)                |

## L3 — cross-overs with creative-coding

| Suggested slug       | Combines                                           |
| -------------------- | -------------------------------------------------- |
| `nz-rainfall-field`  | Time-series data driving a generative flow field   |
| `gh-contrib-rays`    | Contribution grid as kinetic typography            |
| `tube-arrivals-flow` | TfL live data + particle-system encoding           |
| `audio-of-data`      | Sonification: dataset shape => Web Audio synthesis |
