// Treat CSS Modules as class maps
declare module '*.module.css' {
  const classes: { readonly [className: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { readonly [className: string]: string };
  export default classes;
}

// Non-module styles are plain strings
declare module '*.css' {
  const content: string;
  export default content;
}

declare module '*.scss' {
  const content: string;
  export default content;
}


