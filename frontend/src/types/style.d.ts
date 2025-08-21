// Treat CSS Modules as class maps
declare module '*.module.css' {
  const classes: { readonly [className: string]: string };
  export default classes;
}

// Non-module styles are plain strings
declare module '*.css' {
  const content: string;
  export default content;
}


