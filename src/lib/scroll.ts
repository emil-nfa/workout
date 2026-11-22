// The tab screens scroll inside #main (a fixed container), not the page: on iOS, switching from a long scrolled
// page to a short one made fixed bars jump. Scrolling a container keeps the tab bar exactly where it is.
export function scrollTop(): void {
  document.getElementById("main")?.scrollTo({ top: 0 });
}
