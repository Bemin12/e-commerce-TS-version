declare namespace NodeJS {
  interface ProcessEnv {
    readonly PORT: number;
    readonly NODE_ENV: 'development' | 'production';
    readonly BASE_URL: string;

    readonly DB_PASSWORD: string;
    readonly DB_USER: string;
    readonly DB_URI: string;

    readonly ACCESS_TOKEN_SECRET: string;
    readonly ACCESS_TOKEN_EXPIRES_IN: string;
    readonly REFRESH_TOKEN_SECRET: string;
    readonly REFRESH_TOKEN_EXPIRES_IN: string;
    readonly REFRESH_TOKEN_COOKIE_EXPIRES_IN: number;

    readonly EMAIL_HOST: string;
    readonly EMAIL_PORT: string;
    readonly EMAIL_USERNAME: string;
    readonly EMAIL_PASSWORD: string;

    readonly SENDGRID_USERNAME: string;
    readonly SENDGRID_PASSWORD: string;

    readonly EMAIL_FROM: string;

    readonly STRIPE_API_SECRET: string;
    readonly STRIPE_WEBHOOK_SECRET: string;
  }
}
