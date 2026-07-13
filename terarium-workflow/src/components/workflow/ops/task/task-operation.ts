import type { Operation, BaseState } from '@/types/workflow';

export interface TaskOperationState extends BaseState {
  id: string;
  modelId: string;
  description: string;
}

export const TaskOperation: Operation = {
	name: 'Task',
	displayName: 'Task',
	description: 'Task operator',
	documentationUrl: undefined,
	inputs: [
    { type: 'string', label: '' }
  ],
	outputs: [{ type: 'string', label: '' }],
	initState: () => {
		return { 
      id: '',
      modelId: '',
      description: ''
    }
	}
};
