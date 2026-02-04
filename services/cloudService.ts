/**
 * Simple Cloud Sync Service using JSONBlob
 * This allows multiple devices to share the same 'Workspace' 
 * without a dedicated backend server.
 */

const BASE_URL = 'https://jsonblob.com/api/jsonBlob';

export interface CloudData {
  employees: any[];
  attendance: any[];
  leaveRequests: any[];
  lastUpdated: number;
}

export const cloudService = {
  // Create a new cloud workspace and return its ID
  createWorkspace: async (initialData: CloudData): Promise<string> => {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(initialData)
    });
    const location = response.headers.get('Location');
    if (!location) throw new Error("Failed to create workspace");
    return location.split('/').pop() || "";
  },

  // Update existing workspace
  pushData: async (workspaceId: string, data: CloudData): Promise<void> => {
    await fetch(`${BASE_URL}/${workspaceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  // Fetch latest data from workspace
  pullData: async (workspaceId: string): Promise<CloudData | null> => {
    try {
      const response = await fetch(`${BASE_URL}/${workspaceId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (e) {
      console.error("Sync Pull Error:", e);
      return null;
    }
  }
};
