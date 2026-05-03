import org.gradle.jvm.tasks.Jar
import org.gradle.plugins.signing.Sign
import org.gradle.api.publish.maven.MavenPublication
import org.gradle.testing.jacoco.tasks.JacocoReport

// SPDX-License-Identifier: Apache-2.0
plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
    id("com.google.protobuf")
    id("jacoco")
    id("maven-publish")
    id("signing")
}

group = "com.lukuid"
version = (findProperty("VERSION_NAME") as String?) ?: "1.0.14"

jacoco {
    toolVersion = "0.8.12"
}

android {
    namespace = "com.lukuid.sdk"
    compileSdk = 34

    defaultConfig {
        minSdk = 26
        consumerProguardFiles("consumer-rules.pro")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    lint {
        warningsAsErrors = false
    }

    publishing {
        singleVariant("release") {
            withSourcesJar()
        }
    }
}

val syncCanonicalProto by tasks.registering(Copy::class) {
    from(rootProject.projectDir.resolve("../lukuid.proto"))
    into(projectDir.resolve("src/main/proto"))
}

val emptyJavadocJar by tasks.registering(Jar::class) {
    archiveClassifier.set("javadoc")
    from(rootProject.projectDir.resolve("README.md"))
}

protobuf {
    protoc {
        artifact = "com.google.protobuf:protoc:3.25.1"
    }
    generateProtoTasks {
        all().configureEach {
            dependsOn(syncCanonicalProto)
            builtins {
                create("java") {
                    option("lite")
                }
                create("kotlin") {
                    option("lite")
                }
            }
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("org.bouncycastle:bcprov-jdk18on:1.79")
    implementation("org.bouncycastle:bcpkix-jdk18on:1.79")
    implementation("com.github.mik3y:usb-serial-for-android:3.8.0")
    api("com.google.protobuf:protobuf-kotlin-lite:3.25.1")
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.json:json:20240303")
}

publishing {
    publications {
        create<MavenPublication>("release") {
            groupId = "com.lukuid"
            artifactId = "lukuid-sdk-android"
            version = project.version.toString()
            afterEvaluate {
                from(components["release"])
            }
            artifact(emptyJavadocJar)
            pom {
                name.set("LukuID Android SDK")
                description.set("Android SDK for connecting to LukuID devices and verifying .luku evidence archives.")
                url.set("https://github.com/lukuid/sdk")
                licenses {
                    license {
                        name.set("Apache License 2.0")
                        url.set("https://www.apache.org/licenses/LICENSE-2.0")
                        distribution.set("repo")
                    }
                }
                scm {
                    connection.set("scm:git:https://github.com/lukuid/sdk.git")
                    developerConnection.set("scm:git:ssh://git@github.com/lukuid/sdk.git")
                    url.set("https://github.com/lukuid/sdk")
                }
                developers {
                    developer {
                        id.set("lukuid")
                        name.set("LukuID")
                        email.set("hello@lukuid.com")
                    }
                }
            }
        }
    }
    repositories {
        maven {
            name = "GitHubPackages"
            url = uri("https://maven.pkg.github.com/lukuid/sdk")
            credentials {
                username = System.getenv("GITHUB_ACTOR")
                password = System.getenv("GITHUB_TOKEN")
            }
        }
        if (!System.getenv("MAVEN_CENTRAL_USERNAME").isNullOrBlank() && !System.getenv("MAVEN_CENTRAL_PASSWORD").isNullOrBlank()) {
            maven {
                name = "SonatypeCentral"
                url = uri("https://ossrh-staging-api.central.sonatype.com/service/local/staging/deploy/maven2/")
                credentials {
                    username = System.getenv("MAVEN_CENTRAL_USERNAME")
                    password = System.getenv("MAVEN_CENTRAL_PASSWORD")
                }
            }
        }
    }
}

val signingKey = System.getenv("SIGNING_KEY")
val signingPassword = System.getenv("SIGNING_PASSWORD")

signing {
    if (!signingKey.isNullOrBlank()) {
        useInMemoryPgpKeys(signingKey, signingPassword)
        sign(publishing.publications)
    }
}

tasks.withType<Sign>().configureEach {
    onlyIf { !signingKey.isNullOrBlank() }
}

tasks.register<JacocoReport>("jacocoDebugUnitTestReport") {
    dependsOn("testDebugUnitTest")

    reports {
        xml.required.set(true)
        html.required.set(true)
        csv.required.set(false)
    }

    val coverageExcludes = listOf(
        "**/R.class",
        "**/R$*.class",
        "**/BuildConfig.*",
        "**/Manifest*.*",
        "**/*Test*.*",
        "**/*${'$'}Companion.class",
        "**/*${'$'}WhenMappings.class"
    )

    classDirectories.setFrom(
        files(
            fileTree(layout.buildDirectory.dir("tmp/kotlin-classes/debug")) {
                exclude(coverageExcludes)
            },
            fileTree(layout.buildDirectory.dir("intermediates/javac/debug/compileDebugJavaWithJavac/classes")) {
                exclude(coverageExcludes)
            }
        )
    )

    sourceDirectories.setFrom(
        files(
            projectDir.resolve("src/main/java"),
            projectDir.resolve("src/main/kotlin")
        )
    )

    executionData.setFrom(
        files(
            layout.buildDirectory.file("jacoco/testDebugUnitTest.exec"),
            layout.buildDirectory.file("outputs/unit_test_code_coverage/debugUnitTest/testDebugUnitTest.exec")
        )
    )
}
