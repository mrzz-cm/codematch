#!/bin/sh

set -e

if ! dpkg -s openjdk-8-jdk >/dev/null 2>&1; then
    apt-get update
    apt-get install openjdk-8-jdk android-tools-adb
fi

java -version
update-alternatives --config java

# download und unzip Android SDK Tools
wget "https://dl.google.com/android/repository/$ANDROID_SDK_TOOLS" >/dev/null 2>&1

mkdir "${HOME}/sdk"
unzip "${ANDROID_SDK_TOOLS}" -d "${HOME}/sdk"

# create empty cfg file to prevent sdkmanager warning message
mkdir -p "${HOME}/.android" && touch "${HOME}/.android/repositories.cfg"
