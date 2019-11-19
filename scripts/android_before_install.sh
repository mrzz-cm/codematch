#!/bin/sh

if ! dpkg -s openjdk-8-jdk >/dev/null 2>&1; then
    apt-get update
    apt-get install openjdk-8-jdk
fi

java -version
update-alternatives --config java

export JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64

# download und unzip Android SDK Tools
wget "https://dl.google.com/android/repository/$ANDROID_SDK_TOOLS"

unzip -q "${ANDROID_SDK_TOOLS}" -d "${HOME}/sdk"
export PATH="${PATH}:${HOME}/sdk/tools/bin"
export ANDROID_HOME="${HOME}/sdk"

# create empty cfg file to prevent sdkmanager warning message
mkdir -p "${HOME}/.android" && touch "${HOME}/.android/repositories.cfg"
