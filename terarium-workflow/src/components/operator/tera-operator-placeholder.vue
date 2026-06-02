<template>
	<aside>
		<img :src="placeholderGraphic" alt="Plant icon" />
		<slot />
	</aside>
</template>

<script setup lang="ts">
import type { WorkflowNode } from '@/types/workflow';
import { WorkflowOperationTypes } from '@/types/workflow';
import plants from '@/assets/svg/plants.svg';
import calibrateSimulateCiemss from '@assets/svg/operator-images/calibrate-simulate-probabilistic.svg';
import calibrateEnsembleCiemss from '@assets/svg/operator-images/calibrate-ensemble-probabilistic.svg';
import dataset from '@assets/svg/operator-images/dataset.svg';
import transformDataset from '@assets/svg/operator-images/transform-dataset.svg';
import document from '@assets/svg/operator-images/document.svg';
import model from '@assets/svg/operator-images/model.svg';
import configureModel from '@assets/svg/operator-images/configure-model.svg';
import editModel from '@assets/svg/operator-images/edit-model.svg';
import createModelFromEquations from '@assets/svg/operator-images/create-model-from-equation.svg';
import optimizeModel from '@assets/svg/operator-images/optimize-model.svg';
import simulateProbabilistic from '@assets/svg/operator-images/simulate-probabilistic.svg';
import simulateEnsembleCiemss from '@assets/svg/operator-images/simulate-ensemble-probabilistic.svg';
import stratifyModel from '@assets/svg/operator-images/stratify-model.svg';

const props = defineProps<{
	node: WorkflowNode<any>;
}>();

let placeholderGraphic = plants;

switch (props.node.operationType) {
	case WorkflowOperationTypes.CALIBRATE_ENSEMBLE_CIEMSS:
		placeholderGraphic = calibrateEnsembleCiemss;
		break;
	case WorkflowOperationTypes.CALIBRATION_CIEMSS:
		placeholderGraphic = calibrateSimulateCiemss;
		break;
	case WorkflowOperationTypes.DATASET:
		placeholderGraphic = dataset;
		break;
	case WorkflowOperationTypes.DATASET_TRANSFORMER:
		placeholderGraphic = transformDataset;
		break;
	case WorkflowOperationTypes.DOCUMENT:
		placeholderGraphic = document;
		break;
	case WorkflowOperationTypes.MODEL:
		placeholderGraphic = model;
		break;
	case WorkflowOperationTypes.MODEL_CONFIG:
		placeholderGraphic = configureModel;
		break;
	case WorkflowOperationTypes.MODEL_EDIT:
		placeholderGraphic = editModel;
		break;
	case WorkflowOperationTypes.MODEL_FROM_EQUATIONS:
		placeholderGraphic = createModelFromEquations;
		break;
	case WorkflowOperationTypes.OPTIMIZE_CIEMSS:
		placeholderGraphic = optimizeModel;
		break;
	case WorkflowOperationTypes.SIMULATE_CIEMSS:
		placeholderGraphic = simulateProbabilistic;
		break;
	case WorkflowOperationTypes.SIMULATE_ENSEMBLE_CIEMSS:
		placeholderGraphic = simulateEnsembleCiemss;
		break;
	case WorkflowOperationTypes.STRATIFY_MIRA:
		placeholderGraphic = stratifyModel;
		break;
	default:
		placeholderGraphic = plants;
}
</script>

<style scoped>
aside {
	color: var(--text-color-subdued);
	display: flex;
	flex-direction: column;
	gap: var(--gap-6);
	justify-content: center;
	margin-top: var(--gap-3);
	margin-bottom: var(--gap-3);
	text-align: center;
	font-size: var(--font-caption);
}

img {
	height: 5.5rem;
	margin: 0 auto;
	max-height: 8rem;
	pointer-events: none;
}
</style>
