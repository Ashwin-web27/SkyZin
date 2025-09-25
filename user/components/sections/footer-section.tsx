export function FooterSection() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-black/30">
      <div className="container mx-auto grid gap-6 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h4 className="text-sm font-semibold">School</h4>
          <ul className="mt-2 space-y-1 text-sm text-white/70">
            <li>About</li>
            <li>Tracks</li>
            <li>Pricing</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Company</h4>
          <ul className="mt-2 space-y-1 text-sm text-white/70">
            <li>Careers</li>
            <li>Partners</li>
            <li>Blog</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Apps</h4>
          <ul className="mt-2 space-y-1 text-sm text-white/70">
            <li>iOS</li>
            <li>Android</li>
            <li>Desktop</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Get in touch</h4>
          <p className="mt-2 text-sm text-white/70">hello@SkyZin.io</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">
        © {new Date().getFullYear()} SkyZin. All rights reserved.
      </div>
    </footer>
  )
}
