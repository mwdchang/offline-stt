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
    graph: `
composition_id: weather_land_battery
description: Runs weather, landing control, and the drone platform subsystem for a landing task.
inputs:
  time_s:
    type: float
    unit: s
    required: true
    where:
    - self >= 0.0
  position_m:
    type: 'list[float]'
    unit: m
    items:
      where:
      - self >= -100000.0
      - self <= 100000.0
    required: true
    where:
    - len(self) == 3
    - 'self[2] >= 0.0'
    - 'self[2] <= 3000.0'
  heading_rad:
    type: float
    unit: rad
    required: true
    where:
    - self >= -3.141592653589793
    - self <= 3.141592653589793
  landing_position_m:
    type: 'list[float]'
    unit: m
    items:
      where:
      - self >= -100000.0
      - self <= 100000.0
    required: true
    where:
    - len(self) == 3
    - 'self[2] >= 0.0'
    - 'self[2] <= 3000.0'
  commanded_speed_mps:
    type: float
    unit: m/s
    required: true
    where:
    - self > 0.0
    - self <= 22.0
  acceptance_radius_m:
    type: float
    unit: m
    required: true
    where:
    - self > 0.0
    - self <= 1000.0
  soc_percent:
    type: float
    unit: percent
    required: true
    where:
    - self >= 0.0
    - self <= 100.0
    - self >= inputs.reserve_soc_percent
  reserve_soc_percent:
    type: float
    unit: percent
    required: true
    where:
    - self >= 0.0
    - self <= 100.0
  base_wind_mps:
    type: 'list[float]'
    unit: m/s
    items:
      where:
      - self >= -100.0
      - self <= 100.0
    required: true
    where:
    - len(self) == 3
    - 'self[0] * self[0] + self[1] * self[1] <= 64.0'
  base_temperature_c:
    type: float
    unit: degC
    required: true
    where:
    - self >= -50.0
    - self <= 60.0
  payload_kg:
    type: float
    unit: kg
    required: true
    where:
    - self >= 0.0
    - self <= 10.0
  dt_s:
    type: float
    unit: s
    required: true
    where:
    - self > 0.0
    - self <= 60.0
  voltage_v:
    type: float
    unit: V
    required: true
    where:
    - self >= 18.0
    - self <= 25.2
  battery_temperature_c:
    type: float
    unit: degC
    required: true
    where:
    - self >= -40.0
    - self <= 60.0
  health_percent:
    type: float
    unit: percent
    required: true
    where:
    - self > 0.0
    - self <= 100.0
outputs:
  next_position_m:
    from: $platform.next_position_m
    type: 'list[float]'
    unit: m
    items:
      where:
      - self >= -100000.0
      - self <= 100000.0
    where:
    - len(self) == 3
  next_heading_rad:
    from: $platform.next_heading_rad
    type: float
    unit: rad
  task_complete:
    from: $control.task_complete
    type: bool
  task_elapsed_s:
    from: $control.task_elapsed_s
    type: float
    unit: s
    where:
    - self >= 0.0
  control_warnings:
    from: $control.warnings
    type: 'list[str]'
    where:
    - len(self) >= 0
    - len(self) <= 16
  drone_warnings:
    from: $platform.drone_warnings
    type: 'list[str]'
    where:
    - len(self) >= 0
    - len(self) <= 16
  battery_warnings:
    from: $platform.battery_warnings
    type: 'list[str]'
    where:
    - len(self) >= 0
    - len(self) <= 16
  next_soc_percent:
    from: $platform.next_soc_percent
    type: float
    unit: percent
    where:
    - self >= 0.0
    - self <= 100.0
    - self <= inputs.soc_percent
  next_voltage_v:
    from: $platform.next_voltage_v
    type: float
    unit: V
    where:
    - self >= 0.0
  next_battery_temperature_c:
    from: $platform.next_battery_temperature_c
    type: float
    unit: degC
    where:
    - self >= -50.0
    - self <= 100.0
  next_health_percent:
    from: $platform.next_health_percent
    type: float
    unit: percent
    where:
    - self > 0.0
    - self <= 100.0
    - self == inputs.health_percent
  next_time_s:
    from: $platform.next_time_s
    type: float
    unit: s
    where:
    - self > 0.0
    - self == inputs.time_s + inputs.dt_s
nodes:
- id: weather
  model: weather
  inputs:
    time_s: $inputs.time_s
    position_m: $inputs.position_m
    base_wind_mps: $inputs.base_wind_mps
    base_temperature_c: $inputs.base_temperature_c
- id: control
  model: land
  inputs:
    position_m: $inputs.position_m
    heading_rad: $inputs.heading_rad
    time_s: $inputs.time_s
    landing_position_m: $inputs.landing_position_m
    commanded_speed_mps: $inputs.commanded_speed_mps
    acceptance_radius_m: $inputs.acceptance_radius_m
    dt_s: $inputs.dt_s
- id: platform
  composition: drone_platform
  inputs:
    position_m: $inputs.position_m
    heading_rad: $inputs.heading_rad
    time_s: $inputs.time_s
    commanded_velocity_mps: $control.commanded_velocity_mps
    wind_mps: $weather.wind_mps
    air_density_kg_m3: $weather.air_density_kg_m3
    ambient_temperature_c: $weather.temperature_c
    payload_kg: $inputs.payload_kg
    dt_s: $inputs.dt_s
    soc_percent: $inputs.soc_percent
    reserve_soc_percent: $inputs.reserve_soc_percent
    voltage_v: $inputs.voltage_v
    battery_temperature_c: $inputs.battery_temperature_c
    health_percent: $inputs.health_percent
    max_continuous_power_w: 900.0
    max_peak_power_w: 1400.0
    `
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
