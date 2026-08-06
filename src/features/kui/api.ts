import { kuiState } from '../../state/kuiState';

export async function fetchPostFileData(): Promise<Map<string, string>> {
  const urlMatch = window.location.pathname.match(/\/(?<service>[^/]+)\/user\/(?<creator_id>[^/]+)\/post\/(?<post_id>[^/]+)/);
  const fileDataMap = new Map<string, string>();
  if (!urlMatch || !urlMatch.groups) return fileDataMap;

  const { service, creator_id, post_id } = urlMatch.groups;
  const apiUrl = `/api/v1/${service}/user/${creator_id}/post/${post_id}`;
  const fetchOptions: RequestInit = { headers: {} };

  if (kuiState.sessionKey) {
    (fetchOptions.headers as Record<string, string>)["Cookie"] = `session=${kuiState.sessionKey}`;
  } else {
    fetchOptions.credentials = "include";
  }

  try {
    const response = await fetch(apiUrl, fetchOptions);
    if (!response.ok) throw new Error(`API request failed: ${response.status}`);
    const postData = await response.json();
    const allFiles = [
      ...(postData.post?.file ? [postData.post.file] : []),
      ...(postData.post?.attachments ?? [])
    ];
    allFiles.forEach((file: any) => {
      if (file?.name && file.path) {
        fileDataMap.set(file.name, file.path);
      }
    });
  } catch (error) {
    if (kuiState.isVerboseDebugEnabled) {
      console.error("[KUI API] Error fetching file data.", error);
    }
  }
  return fileDataMap;
}
