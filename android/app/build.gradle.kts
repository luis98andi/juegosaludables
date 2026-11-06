plugins {
    id("com.android.application")
}

android {
    namespace = "com.luis98andi.juegosaludables"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.luis98andi.juegosaludables"
        minSdk = 23
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }
}
