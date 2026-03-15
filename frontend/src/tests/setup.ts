import '@testing-library/jest-dom'

// jsdom は scrollIntoView を実装していないためモックする
Element.prototype.scrollIntoView = () => {}
