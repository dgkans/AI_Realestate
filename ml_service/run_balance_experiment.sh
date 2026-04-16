#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "Running price-balance experiment..."
cd "${REPO_ROOT}/ml_service"
python3 -m src.balance_experiment

echo ""
echo "Done. Artifacts generated:"
echo "- ${REPO_ROOT}/demo_artifacts/sample_outputs/price_balance_experiment.json"
echo "- ${REPO_ROOT}/demo_artifacts/plots/price_balance_comparison.png"
