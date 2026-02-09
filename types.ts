
export interface VulnerabilityDetail {
  id: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  remediation?: string;
}

export interface Service {
  port: number;
  protocol: 'TCP' | 'UDP';
  name: string;
  version: string;
  state: 'open' | 'filtered' | 'closed';
  vulnerabilities: VulnerabilityDetail[];
}

export interface Subdomain {
  host: string;
  ip: string;
  type: string;
  status: 'online' | 'offline';
  hostingProvider?: string;
  os?: {
    name: string;
    version: string;
    family: string;
    confidence: number;
  };
  services?: Service[];
  intelligenceSummary?: string;
}

export interface DeviceInfo {
  host: string;
  ip: string;
  hostingProvider: string;
  os: {
    name: string;
    version: string;
    family: string;
    confidence: number;
  };
  services: Service[];
  subdomains: Subdomain[];
  relatedInfrastructure: string[];
  latency: string;
  uptime: string;
  macAddress?: string;
  vendor?: string;
  intelligenceSummary: string;
}

export interface NetworkNode {
  id: string;
  label: string;
  type: 'host' | 'service' | 'gateway' | 'subdomain';
  status: 'online' | 'offline' | 'warning';
  ip?: string;
}

export interface NetworkLink {
  source: string;
  target: string;
  value: number;
}

export interface ScanHistoryItem {
  id: string;
  host: string;
  timestamp: string;
  status: 'completed' | 'failed';
  uptime?: string;
}

export interface ThreatIntelligenceItem {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  timestamp: string;
  tags: string[];
}
