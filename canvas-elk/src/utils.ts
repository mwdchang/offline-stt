import YAML from 'yaml';

const yaml2json = (yamlString: string) => {
  return YAML.parse(yamlString);
}

export { yaml2json }
