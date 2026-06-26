import weatherLandBattery from './models/weather_land_battery.yaml?raw';
import dronePlatform from './models/drone_platform.yaml?raw';

export interface ElkPoint {
  x: number;
  y: number;
}

export interface ElkLabel {
  text?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface ElkEdgeSection {
  id: string;
  startPoint: ElkPoint;
  endPoint: ElkPoint;
  bendPoints?: ElkPoint[];
}

export interface ElkExtendedEdge {
  id: string;
  sources: string[];
  targets: string[];
  sections?: ElkEdgeSection[];
  container?: string;
}

export interface ElkNode {
  id: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  labels?: ElkLabel[];
  children?: ElkNode[];
  edges?: ElkExtendedEdge[];
  layoutOptions?: Record<string, string>;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  // graph: ElkNode;
  graph: string;
}


export const presets: Preset[] = [
  {
    id: 'weather_land_battery',
    name: 'Weather land battery',
    description: 'Weather land battery',
    graph: weatherLandBattery
  },
  {
    id: 'drone_platform',
    name: 'Drone platform',
    description: 'Drone',
    graph: dronePlatform
  }
];


/*
export const presets: Preset[] = [
  {
    id: 'pipeline',
    name: 'Standard Processing Pipeline',
    description: 'A classic sequence of operations containing processing and storage compound nodes.',
    graph: {
      id: 'root',
      children: [
        {
          id: 'input_parser',
          width: 140,
          height: 60,
          labels: [{ text: 'Input Parser' }]
        },
        {
          id: 'processor_cluster',
          labels: [{ text: 'Processing Engine' }],
          // Padding option creates space at the top for the title
          layoutOptions: {
            'elk.padding': '[top=45,left=20,bottom=20,right=20]',
            'elk.spacing.nodeNode': '20'
          },
          children: [
            {
              id: 'validator',
              width: 110,
              height: 60,
              labels: [{ text: 'Validator' }]
            },
            {
              id: 'transformer',
              width: 110,
              height: 60,
              labels: [{ text: 'Transformer' }]
            },
            {
              id: 'enricher',
              width: 110,
              height: 60,
              labels: [{ text: 'Enricher' }]
            }
          ],
          edges: [
            {
              id: 'e_internal_1',
              sources: ['validator'],
              targets: ['transformer']
            },
            {
              id: 'e_internal_2',
              sources: ['transformer'],
              targets: ['enricher']
            }
          ]
        },
        {
          id: 'storage_cluster',
          labels: [{ text: 'Storage Cluster' }],
          layoutOptions: {
            'elk.padding': '[top=45,left=20,bottom=20,right=20]',
            'elk.spacing.nodeNode': '20'
          },
          children: [
            {
              id: 'write_cache',
              width: 110,
              height: 60,
              labels: [{ text: 'Write Cache' }]
            },
            {
              id: 'relational_db',
              width: 110,
              height: 60,
              labels: [{ text: 'Main DB' }]
            }
          ],
          edges: [
            {
              id: 'e_internal_3',
              sources: ['write_cache'],
              targets: ['relational_db']
            }
          ]
        },
        {
          id: 'output_api',
          width: 140,
          height: 60,
          labels: [{ text: 'API Gateway' }]
        }
      ],
      edges: [
        {
          id: 'e_pipeline_1',
          sources: ['input_parser'],
          targets: ['processor_cluster']
        },
        {
          id: 'e_pipeline_2',
          sources: ['processor_cluster'],
          targets: ['storage_cluster']
        },
        {
          id: 'e_pipeline_3',
          sources: ['storage_cluster'],
          targets: ['output_api']
        },
        {
          id: 'e_bypass_lane',
          sources: ['input_parser'],
          targets: ['output_api']
        }
      ]
    }
  },
  {
    id: 'microservices',
    name: 'Microservices Architecture',
    description: 'Multiple independent service clusters communicating across hierarchical levels.',
    graph: {
      id: 'root',
      children: [
        {
          id: 'web_portal',
          width: 140,
          height: 60,
          labels: [{ text: 'Web Portal UI' }]
        },
        {
          id: 'auth_suite',
          labels: [{ text: 'Auth Service Suite' }],
          layoutOptions: {
            'elk.padding': '[top=45,left=20,bottom=20,right=20]',
            'elk.spacing.nodeNode': '25'
          },
          children: [
            {
              id: 'gateway',
              width: 120,
              height: 50,
              labels: [{ text: 'Edge Gateway' }]
            },
            {
              id: 'auth_verifier',
              width: 120,
              height: 50,
              labels: [{ text: 'Token Verifier' }]
            },
            {
              id: 'redis_sessions',
              width: 120,
              height: 50,
              labels: [{ text: 'Session Store' }]
            }
          ],
          edges: [
            {
              id: 'e_auth_1',
              sources: ['gateway'],
              targets: ['auth_verifier']
            },
            {
              id: 'e_auth_2',
              sources: ['auth_verifier'],
              targets: ['redis_sessions']
            }
          ]
        },
        {
          id: 'core_services',
          labels: [{ text: 'Core Commerce Services' }],
          layoutOptions: {
            'elk.padding': '[top=45,left=20,bottom=20,right=20]',
            'elk.spacing.nodeNode': '25'
          },
          children: [
            {
              id: 'catalog_svc',
              width: 120,
              height: 50,
              labels: [{ text: 'Catalog Service' }]
            },
            {
              id: 'cart_svc',
              width: 120,
              height: 50,
              labels: [{ text: 'Cart Service' }]
            },
            {
              id: 'payment_svc',
              width: 120,
              height: 50,
              labels: [{ text: 'Payment Svc' }]
            }
          ],
          edges: [
            {
              id: 'e_commerce_1',
              sources: ['catalog_svc'],
              targets: ['cart_svc']
            },
            {
              id: 'e_commerce_2',
              sources: ['cart_svc'],
              targets: ['payment_svc']
            }
          ]
        },
        {
          id: 'analytics_lake',
          labels: [{ text: 'Data Analytics & Lake' }],
          layoutOptions: {
            'elk.padding': '[top=45,left=20,bottom=20,right=20]',
            'elk.spacing.nodeNode': '20'
          },
          children: [
            {
              id: 'kafka_ingest',
              width: 120,
              height: 50,
              labels: [{ text: 'Kafka Ingest' }]
            },
            {
              id: 'parquet_store',
              width: 120,
              height: 50,
              labels: [{ text: 'Delta Lake' }]
            }
          ],
          edges: [
            {
              id: 'e_lake_1',
              sources: ['kafka_ingest'],
              targets: ['parquet_store']
            }
          ]
        }
      ],
      edges: [
        {
          id: 'e_web_to_gateway',
          sources: ['web_portal'],
          targets: ['auth_suite']
        },
        {
          id: 'e_web_to_catalog',
          sources: ['web_portal'],
          targets: ['core_services']
        },
        // Cross-hierarchy edge: Gateway inside Auth Suite to Catalog inside Core Commerce
        {
          id: 'e_cross_gateway_catalog',
          sources: ['gateway'],
          targets: ['catalog_svc']
        },
        // Cross-hierarchy edge: Payment Service to Kafka Ingestion
        {
          id: 'e_cross_payment_kafka',
          sources: ['payment_svc'],
          targets: ['kafka_ingest']
        }
      ]
    }
  }
];
*/
