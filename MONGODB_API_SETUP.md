# MongoDB Atlas API Setup

## Setting Up API Access

### 1. Generate API Keys in Atlas
1. Log into MongoDB Atlas
2. Go to Organization Settings → Access Manager
3. Click "Create API Key"
4. Set permissions (usually "Organization Read Only" for monitoring)
5. Save the Public and Private keys

### 2. Configure API Access
```bash
# Public Key (Organization: hlumqrgs)
export MONGODB_ATLAS_PUBLIC_KEY="hlumqrgs"

# Private Key (keep this secret!)
export MONGODB_ATLAS_PRIVATE_KEY="your-private-key-here"
```

### 3. API Usage Examples

#### Get Cluster Info
```bash
curl --user "${MONGODB_ATLAS_PUBLIC_KEY}:${MONGODB_ATLAS_PRIVATE_KEY}" \
  --digest \
  --header "Accept: application/json" \
  "https://cloud.mongodb.com/api/atlas/v1.0/groups/{GROUP-ID}/clusters"
```

#### Monitor Database
```javascript
// monitoring.js
const axios = require('axios');

const atlasAPI = axios.create({
  baseURL: 'https://cloud.mongodb.com/api/atlas/v1.0',
  auth: {
    username: process.env.MONGODB_ATLAS_PUBLIC_KEY,
    password: process.env.MONGODB_ATLAS_PRIVATE_KEY
  }
});

async function getClusterStatus(projectId, clusterName) {
  try {
    const response = await atlasAPI.get(
      `/groups/${projectId}/clusters/${clusterName}`
    );
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
  }
}
```

## Common Use Cases

### 1. Automated Backups
```javascript
async function triggerBackup(projectId, clusterName) {
  const response = await atlasAPI.post(
    `/groups/${projectId}/clusters/${clusterName}/backup/snapshots`
  );
  return response.data;
}
```

### 2. Performance Monitoring
```javascript
async function getPerformanceMetrics(projectId, processId) {
  const response = await atlasAPI.get(
    `/groups/${projectId}/processes/${processId}/measurements`,
    {
      params: {
        granularity: 'PT1H',
        period: 'PT24H'
      }
    }
  );
  return response.data;
}
```

### 3. Automated Scaling
```javascript
async function scaleCluster(projectId, clusterName, instanceSize) {
  const response = await atlasAPI.patch(
    `/groups/${projectId}/clusters/${clusterName}`,
    {
      providerSettings: {
        instanceSizeName: instanceSize
      }
    }
  );
  return response.data;
}
```

## Security Best Practices

1. **Never commit API keys** - Use environment variables
2. **Restrict API key permissions** - Only grant necessary access
3. **Rotate keys regularly** - Every 90 days
4. **Use IP whitelisting** - Restrict API access by IP
5. **Monitor API usage** - Check Atlas audit logs

## For Clout Project

Add to your .env files:
```bash
# MongoDB Atlas API (optional, for monitoring)
MONGODB_ATLAS_PUBLIC_KEY=hlumqrgs
MONGODB_ATLAS_PRIVATE_KEY=your-private-key-here
MONGODB_ATLAS_PROJECT_ID=your-project-id
```

This enables:
- Automated health checks
- Performance monitoring
- Backup management
- Scaling automation