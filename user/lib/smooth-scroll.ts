export function smoothScrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId);
  if (element) {
    const navbarHeight = 80; // Account for navbar height
    const elementPosition = element.offsetTop - navbarHeight;
    
    window.scrollTo({
      top: elementPosition,
      behavior: 'smooth'
    });
  }
}

export const navigationItems = [
  { name: 'Home', sectionId: 'home' },
  { name: 'Tracks', sectionId: 'tracks' },
  { name: 'About', sectionId: 'about' },
  { name: 'Services', sectionId: 'services' },
  { name: 'Contact', sectionId: 'contact' }
];