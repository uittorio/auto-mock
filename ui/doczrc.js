import pkg from './package.json';
const libName = pkg.name;

export default {
    typescript: true,
    themeConfig: {
        initialColorMode: 'dark',
        showDarkModeSwitch: false
    },
    base: "./",
    menu: [
        { name: 'Home'},
        { name: 'Installation'},
        { name: 'Create mock', menu: ['Default']},
        { name: 'Create mock list'},
        { name: 'Register mock'},
        { name: 'Extension'},
        { name: 'Types supported'},
        { name: 'Types not supported'},
        { name: 'Config'},
        { name: 'Performance'},
        { name: 'Definitely Typed'}
    ],
    repository: "https://github.com/Typescript-TDD/ts-auto-mock"
}
