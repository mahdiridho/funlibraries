#!/bin/bash

# Script to build signed apk file
# Author: Mahdi Ridho

# 1 is the path of key file
# 2 is the path of unsigned apk file
# 3 is the key alias name
# 4 is the path of signed apk file
# 5 is project folder
if [ ! -z "$1" ] && [ ! -z "$2" ] && [ ! -z "$3" ] && [ ! -z "$4" ] && [ ! -z "$5" ]; then
    cd $5
    pushd platforms/android/app/build/outputs/apk/release/
    rm $2
    popd
    ionic cordova build --release android
    pushd platforms/android/app/build/outputs/apk/release/
    rm $4
    jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore $1 $2 $3
    zipalign -v 4 $2 $4
    popd
else
    echo "Provide the key file, unsigned apk file, key alias, & signed apk file"
    echo "e.g apkBuild.sh my-key.keystore hello-world-unsigned.apk my-key hello-world.apk hello-world-folder"
fi
