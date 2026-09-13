// The canonical new-resume URL renders the wizard directly. Keeping the
// implementation in one place also lets the older /dashboard/resume/create
// route continue to work without introducing a redirect loop.
export { default } from "../../resume/create/page";
