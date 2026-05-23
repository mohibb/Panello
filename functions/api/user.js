export async function onRequestGet({ data }) {
  return Response.json(data.user);
}
