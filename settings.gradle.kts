import org.gradle.api.initialization.resolve.RepositoriesMode

rootProject.name = "lukuid-sdk-native"

pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven { url = uri("https://jitpack.io") }
    }
}

include(":src:android:lukuid-sdk")
project(":src:android:lukuid-sdk").projectDir = File("src/android/lukuid-sdk")

include(":examples:android-demo")
project(":examples:android-demo").projectDir = File("examples/android-demo")
