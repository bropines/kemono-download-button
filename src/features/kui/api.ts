import { kuiState } from '../../state/kuiState';
import { gmXmlhttpRequestWithRetries } from '../../utils/http';

export async function fetchPostFileData(): Promise<Map<string, string>> {
  const urlMatch = window.location.pathname.match(/\/(?<service>[^/]+)\/user\/(?<creator_id>[^/]+)\/post\/(?<post_id>[^/]+)/);
  const fileDataMap = new Map<string, string>();
  if (!urlMatch || !urlMatch.groups) return fileDataMap;

  const { service, creator_id, post_id } = urlMatch.groups;
  // GM_xmlhttpRequest sends the browser's cookies by default and, unlike fetch(), can also send an explicit
  // Cookie header, which is how the manual session key fallback reaches the API
  const headers: Record<string, string> = {};
  if (kuiState.sessionKey) {
    headers["Cookie"] = `session=${kuiState.sessionKey}`;
  }

  try {
    const response = await gmXmlhttpRequestWithRetries({
      method: "GET",
      url: `${window.location.origin}/api/v1/${service}/user/${creator_id}/post/${post_id}`,
      headers,
      responseType: "json"
    });
    const postData = response.response;
    const allFiles = [
      ...(postData?.post?.file ? [postData.post.file] : []),
      ...(postData?.post?.attachments ?? [])
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
