const appConfig = () => ({
    environment: process.env.NODE_ENV || "development",
    jwt_secret: process.env.JWT_SECRET,
    access_token_expiration_minute: process.env.JWT_ACCESS_EXPIRATION_MINUTES,
    refresh_token_expiration_days: process.env.JWT_REFRESH_EXPIRATION_DAYS,
    master_password: process.env.MASTER_PASSWORD,
})

export { appConfig }