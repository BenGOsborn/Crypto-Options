// craco.config.js
export default {
    style: {
        postcss: {
            plugins: [import("tailwindcss"), import("autoprefixer")],
        },
    },
};
