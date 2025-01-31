import faker from 'faker';

const navbarString = `<div>You hava ${faker.random.number()} new notifications</div>`;

document.querySelector('#navbar-list').innerHTML = navbarString;