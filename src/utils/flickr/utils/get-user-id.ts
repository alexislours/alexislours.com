import type { Flickr } from "./ky";

export async function getUserIdFromUsername(
  username: string,
  flickr: Flickr
): Promise<string> {
  const res = await flickr("flickr.people.findByUsername", {
    username,
  });

  return res.user.nsid;
}
