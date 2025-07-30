import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

interface ClusterStatus {
  name: string;
  state: string;
  paused: boolean;
  diskSizeGB: number;
  mongoDBVersion: string;
}

interface DatabaseStats {
  dataSize: number;
  storageSize: number;
  indexes: number;
  collections: number;
}

export class AtlasMonitoringService {
  private api: AxiosInstance;
  private projectId: string;
  
  constructor() {
    // Validate required environment variables
    const publicKey = process.env.MONGODB_ATLAS_PUBLIC_KEY;
    const privateKey = process.env.MONGODB_ATLAS_PRIVATE_KEY;
    this.projectId = process.env.MONGODB_ATLAS_PROJECT_ID || '';
    
    if (!publicKey || !privateKey) {
      console.warn('MongoDB Atlas API keys not configured. Monitoring features disabled.');
      // Create a dummy axios instance that will fail gracefully
      this.api = axios.create();
      return;
    }
    
    // Create authenticated API client
    this.api = axios.create({
      baseURL: 'https://cloud.mongodb.com/api/atlas/v1.0',
      auth: {
        username: publicKey,
        password: privateKey
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }
  
  /**
   * Check if monitoring is properly configured
   */
  isConfigured(): boolean {
    return !!(
      process.env.MONGODB_ATLAS_PUBLIC_KEY && 
      process.env.MONGODB_ATLAS_PRIVATE_KEY &&
      this.projectId
    );
  }
  
  /**
   * Get cluster status
   */
  async getClusterStatus(clusterName: string = 'Cluster0'): Promise<ClusterStatus | null> {
    if (!this.isConfigured()) {
      console.log('Atlas monitoring not configured');
      return null;
    }
    
    try {
      const response = await this.api.get(
        `/groups/${this.projectId}/clusters/${clusterName}`
      );
      
      return {
        name: response.data.name,
        state: response.data.stateName,
        paused: response.data.paused,
        diskSizeGB: response.data.diskSizeGB,
        mongoDBVersion: response.data.mongoDBVersion
      };
    } catch (error) {
      console.error('Error fetching cluster status:', error);
      return null;
    }
  }
  
  /**
   * Get database statistics
   */
  async getDatabaseStats(clusterName: string = 'Cluster0'): Promise<DatabaseStats | null> {
    if (!this.isConfigured()) {
      return null;
    }
    
    try {
      // This would typically require process ID and more complex queries
      // Simplified for demonstration
      const response = await this.api.get(
        `/groups/${this.projectId}/processes`
      );
      
      // Find our cluster's process
      const process = response.data.results.find(
        (p: any) => p.userAlias === clusterName
      );
      
      if (!process) {
        return null;
      }
      
      // Get measurements
      const measurements = await this.api.get(
        `/groups/${this.projectId}/processes/${process.id}/measurements`,
        {
          params: {
            granularity: 'PT1H',
            period: 'PT24H',
            measurementTypes: ['DATABASE_AVERAGE_OBJECT_SIZE', 'DATABASE_STORAGE_SIZE']
          }
        }
      );
      
      return {
        dataSize: measurements.data.measurements[0]?.dataPoints[0]?.value || 0,
        storageSize: measurements.data.measurements[1]?.dataPoints[0]?.value || 0,
        indexes: 0, // Would need additional API calls
        collections: 0 // Would need additional API calls
      };
    } catch (error) {
      console.error('Error fetching database stats:', error);
      return null;
    }
  }
  
  /**
   * Check if cluster needs scaling based on metrics
   */
  async checkScalingNeeded(): Promise<{ needed: boolean; reason?: string }> {
    if (!this.isConfigured()) {
      return { needed: false };
    }
    
    try {
      const status = await this.getClusterStatus();
      if (!status) {
        return { needed: false };
      }
      
      // Example scaling logic
      const stats = await this.getDatabaseStats();
      if (stats && stats.storageSize > status.diskSizeGB * 0.8 * 1024 * 1024 * 1024) {
        return { 
          needed: true, 
          reason: 'Storage usage above 80% threshold' 
        };
      }
      
      return { needed: false };
    } catch (error) {
      console.error('Error checking scaling needs:', error);
      return { needed: false };
    }
  }
  
  /**
   * Get recent alerts
   */
  async getRecentAlerts(limit: number = 10): Promise<any[]> {
    if (!this.isConfigured()) {
      return [];
    }
    
    try {
      const response = await this.api.get(
        `/groups/${this.projectId}/alerts`,
        {
          params: {
            pageNum: 1,
            itemsPerPage: limit,
            status: 'OPEN'
          }
        }
      );
      
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
  }
  
  /**
   * Create a snapshot (backup)
   */
  async createSnapshot(clusterName: string = 'Cluster0', description?: string): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }
    
    try {
      await this.api.post(
        `/groups/${this.projectId}/clusters/${clusterName}/backup/snapshots`,
        {
          description: description || `Manual snapshot - ${new Date().toISOString()}`
        }
      );
      
      console.log('Snapshot created successfully');
      return true;
    } catch (error) {
      console.error('Error creating snapshot:', error);
      return false;
    }
  }
}

// Export singleton instance
export const atlasMonitoring = new AtlasMonitoringService();