import type { ElkNode } from './presets';
import { presets } from './presets';
import { v4 as uuidv4 } from 'uuid';
import { yaml2json } from './utils';

// Artifical "input" node.
const INPUT_NODE = {
  width: 80,
  height: 250,
}

/**
 * Parse bethune's composite model scheme
**/
const parseBethune = function recurse(bethuneNode: any, currentNode: ElkNode, path: string) {
  // Default place holder external variables
  currentNode.children!.push({
    id: `${path}.inputs`,
    labels: [{ text: 'Inputs' }],
    width: INPUT_NODE.width,
    height: INPUT_NODE.height
  });

  const handleEdges = (n: any) => {
    const inputs = Object.keys(n.inputs);
    inputs.forEach((inputKey: any) => {
      const v = n.inputs[inputKey];
      if (typeof v !== 'string') {
        return;
      }
      const src = v.split('.')[0]!.replace('$', '');

      currentNode.edges!.push({
        id: uuidv4(),
        sources: [`${path}.${src}`],
        targets: [`${path}.${n.id}`]
      });
    });
  };

  // Normal models
  bethuneNode.nodes.forEach((n: any) => {
    if (n.composition) return;

    // Node
    currentNode.children!.push({
      id: `${path}.${n.id}`,
      labels: [{ text: n.model }],
      width: 120,
      height: 80,
    });

    // Edge
    handleEdges(n);
  });

  // Composite models
  bethuneNode.nodes.forEach((n: any) => {
    if (n.model) return;
    
    const composite: ElkNode = {
      id: `${path}.${n.id}`,
      labels: [{ text: n.composition }],
      children: [],
      edges: []
    }
    currentNode.children!.push(composite);

    // Edge
    handleEdges(n);

    // Recurse into composite models
    const nextBethuneObj = yaml2json(
      presets.find(d => d.id === n.composition)!.graph 
    );
    
    recurse(nextBethuneObj, composite, `${path}.${n.id}`);
  });
};


const parseBethuneCollapsed = function recurse(bethuneNode: any, currentNode: ElkNode, path: string) {
  // Default place holder external variables
  currentNode.children!.push({
    id: `${path}.inputs`,
    labels: [{ text: 'Inputs' }],
    width: INPUT_NODE.width,
    height: INPUT_NODE.height
  });

  const handleEdges = (n: any) => {
    const inputs = Object.keys(n.inputs);
    const dupes = new Set<string>();

    inputs.forEach((inputKey: any) => {
      const v = n.inputs[inputKey];
      if (typeof v !== 'string') {
        return;
      }
      const src = v.split('.')[0]!.replace('$', '');

      const key = `${path}.${src}: ${path}.${n.id}`;
      if (dupes.has(key)) {
        return;
      } else {
        dupes.add(key);
      }

      currentNode.edges!.push({
        id: uuidv4(),
        sources: [`${path}.${src}`],
        targets: [`${path}.${n.id}`]
      });
    });
  };

  // Normal models
  bethuneNode.nodes.forEach((n: any) => {
    if (n.composition) return;

    // Node
    currentNode.children!.push({
      id: `${path}.${n.id}`,
      labels: [{ text: n.model }],
      width: 120,
      height: 80,
    });

    // Edge
    handleEdges(n);
  });

  // Composite models
  bethuneNode.nodes.forEach((n: any) => {
    if (n.model) return;
    
    const composite: ElkNode = {
      id: `${path}.${n.id}`,
      labels: [{ text: n.composition }],
      children: [],
      edges: []
    }
    currentNode.children!.push(composite);

    // Edge
    handleEdges(n);

    // Recurse into composite models
    const nextBethuneObj = yaml2json(
      presets.find(d => d.id === n.composition)!.graph 
    );
    
    recurse(nextBethuneObj, composite, `${path}.${n.id}`);
  });
}


export { 
  parseBethune,
  parseBethuneCollapsed
};
