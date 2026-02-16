import { withBase } from "./utils/helpers";

export type Image = {
    src: string;
    alt?: string;
    caption?: string;
};

export type Link = {
    text: string;
    href: string;
};

export type Hero = {
    eyebrowText?: string;
    title?: string;
    text?: string;
    image?: Image;
    actions?: Link[];
};

export type About = {
    title?: string;
    text?: string;
};

export type Blog = {
    description?: string;
};

export type ContactInfo = {
    title?: string;
    text?: string;
    email?: {
        text?: string;
        href?: string;
        email?: string;
    };
    socialProfiles?: {
        text?: string;
        href?: string;
    }[];
};

export type Subscribe = {
    title?: string;
    text?: string;
    formUrl: string;
};

export type SiteConfig = {
    website: string;
    logo?: Image;
    title: string;
    description: string;
    image?: Image;
    headerNavLinks?: Link[];
    footerNavLinks?: Link[];
    socialLinks?: Link[];
    hero?: Hero;
    about?: About;
    contactInfo?: ContactInfo;
    subscribe?: Subscribe;
    blog?: Blog;
    postsPerPage?: number;
    recentPostLimit: number;
    projectsPerPage?: number;
};

const siteConfig: SiteConfig = {

    website: 'https://paulabuitrago.github.io/Bases-de-Datos-2',

    title: 'Portafolio',

    description: 'E-portafolio académico para la asignatura bases de datos 2.',

    image: {
        src: '/space-ahead-preview.jpeg',
        alt: 'E-Portafolio Paula Buitrago'
    },

    headerNavLinks: [
        {
            text: 'Inicio',
            href: withBase('/')
        },
        {
            text: 'Evidencias',
            href: withBase('/blog')
        },
        {
            text: 'Etiquetas',
            href: withBase('/tags')
        },
        {
            text: 'Acerca de',
            href: withBase('/about')
        },
        {
            text: 'Presentación',
            href: withBase('/contact')
        }
    ],

    footerNavLinks: [
        {
            text: 'Inicio',
            href: withBase('/')
        },
        {
            text: 'Evidencias',
            href: withBase('/blog')
        },
        {
            text: 'Presentación',
            href: withBase('/contact')
        }
    ],

    socialLinks: [
        {
            text: 'GitHub',
            href: 'https://github.com/PauliIi1'
        }
    ],

    hero: {
        eyebrowText: 'Bases de Datos II',
        title: 'Paula Buitrago',
        text: 'Bienvenido a mi e-portafolio académico. Aquí encontrarás mis proyectos, evidencias y avances desarrollados durante el curso.',
        actions: [
            {
                text: 'Ver Evidencias',
                href: withBase('/blog')
            },
            {
                text: 'Ir a Presentación',
                href: withBase('/contact')
            }
        ]
    },

    about: {
        title: 'Acerca de este sitio',
        text: 'Este e-portafolio documenta mi proceso de aprendizaje, proyectos prácticos y evolución académica en la asignatura de Bases de Datos II.',
    },

    contactInfo: {
        title: 'Presentación',
        text: 'Bienvenido, soy Paula. En esta sección encontrarás mi video de presentación y mi contacto por si deseas comunicarte conmigo.',
        email: {
            text: "Correo institucional:",
            href: "mailto:pbuitragov@unbosque.edu.co",
            email: "pbuitragov@unbosque.edu.co"
        },
        socialProfiles: []
    },

    subscribe: {
        title: '',
        text: '',
        formUrl: '#'
    },

    blog: {
        description: "En esta sección encontrarás todas las evidencias, actividades y avances desarrollados durante el curso."
    },

    postsPerPage: 2,
    recentPostLimit: 3
};

export default siteConfig;
