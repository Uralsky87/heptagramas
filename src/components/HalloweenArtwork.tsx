/** Decorative illustration shared by the invitation and the event detail. */
export default function HalloweenArtwork() {
  return <img className="halloween-artwork" src={`${import.meta.env.BASE_URL}halloween-scene.svg`} alt="" aria-hidden="true" width="330" height="240" />;
}
