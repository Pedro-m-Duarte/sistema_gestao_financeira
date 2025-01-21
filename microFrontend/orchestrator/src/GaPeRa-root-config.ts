import { registerApplication, start } from "single-spa";

const apps = [
  {
    name: '@GaPeRa/menu',
    activeWhen: location => location.pathname.startsWith('/'),
    domElement: 'menu' 
  },
  {
    name: '@GaPeRa/dashboard',
    activeWhen: location => location.pathname.startsWith('/dashboard'),
    domElement: 'container' 
  },
  {
    name: '@GaPeRa/control',
    activeWhen: location => location.pathname.startsWith('/control'),
    domElement: 'container' 
  }
]

for (const {name, activeWhen, domElement} of apps) {
  registerApplication(
    name,
    () => import(name),
    activeWhen,
    {domElement:document.getElementById(domElement)}
  );
}

start({
  urlRerouteOnly: true,
});
