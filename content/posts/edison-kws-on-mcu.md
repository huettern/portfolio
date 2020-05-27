---
title: "Edison - Keyword Spotting on Microcontroller"
author: "Noah Hütter"
layout: post
date: "2020-05-27"
tags: ["AI", "Microcontroller", "ML"]
category: ["microcontroller","ai", "ml"]
image: "img/edison/edison-hw.jpg"
jumbo: "img/edison/edison-head.png"
description: "In my first project on the topic of Machine Learning I implemented a simple keyword spotting algorithm on a Microcontroller. In this post I will walk you through the steps of implementing and testing feature extraction and a neural network on a MCU!"
---

## TLDR
Download pre-processed audio data, train the model, implement it and compile the MCU code.

```bash
# clone and setup
git clone https://github.com/noah95/edison
cd edison
source bootstrap.sh

# fetch training data and pre-trained model
curl -L https://github.com/noah95/edison/releases/download/v2.0.0-RC1/keywords-8-noah.tar.gz | tar xvz
curl -L https://github.com/noah95/edison/releases/download/v2.0.0-RC1/kws_model.h5 -o cache/kws_keras/kws_model.h5

# train model
./main.py train keras train
cp cache/kws_keras/kws_model.h5 ../firmware/src/ai/cube/kws/kws_model.h5
```

- open cube project firmware/CubeMX/edison.ioc
- Additional Software -> STMicro... -> kws
- Browse: select firmware/src/ai/cube/kws/kws_model.h5
- Analyze
- click GENERATE CODE

```bash
# import net to firmware folder
cd ../firmware/
make import-cubeai-net

# build MCU code
make -j8

# Flash board
make flash
```

## Prerequisites
To start experimenting with keyword spotting, clone my repository 

```bash
git clone https://github.com/noah95/edison
cd edison
```

and setup the python virtual environment. This script initializes required submodules, sets up the environment including paths and packages.

```bash
source bootstrap.sh
```

To recreate the graphs in this writeup, fetch my training data and a pretrained model.
```bash
cd audio
curl -L https://github.com/noah95/edison/releases/download/v2.0.0-RC1/keywords-8-noah.tar.gz | tar xvz
curl -L https://github.com/noah95/edison/releases/download/v2.0.0-RC1/kws_model.h5 -o cache/kws_keras/kws_model.h5
```

For the microcontroller code you need the [STM32CubeMX initialization code generator](https://www.st.com/en/development-tools/stm32cubemx.html)
with the X-CUBE-AI extension that can be installed from within CubeMX. Furthermore a `arm-none-eabi` toolchain is required. During the 
course of this project the following version was used:

```
arm-none-eabi-gcc (GNU Tools for Arm Embedded Processors 8-2018-q4-major) 8.2.1 20181213 (release) [gcc-8-branch revision 267074]
```

The code was run on a [B-L475E-IOT01A STM32L4 Discovery kit IoT node](https://www.st.com/en/evaluation-tools/b-l475e-iot01a.html) with 
[WS2811](https://www.adafruit.com/product/1426) LEDs for indication. With some modifications the code can be ported to any STM32L4 
based platform with onboard PDM MEMS microphones.

Now you are good to go!

## Keyword Spotting Task
The pipeline of audio processing includes data acquisition, feature extraction, the neural network and a small state machine for processing
the networks predictions. I won't go into detail of data acquisition so we start at the feature extraction which is done by means of
mel frequency cepstral coefficients. A subset of these coefficients is then fed into a convolutional neural network which is trained to
predict, which keyword was spoken. The state machine then decides, what action should be performed.

![](kws-task.png)

### Cepstral Coefficients
The raw audio data is preprocessed before fed into the neural network. This brings the advantage of
- Reducing the dimensionality at the net input: 1024 audio samples get compressed to 13 ceofficients. This reduces network complexity which results in shorter training time and faster inference. 
- Removing irrelevant data such as noise.
- Transform the linear frequency response to a logarithmic which is more similar to a human ear.

The technique applied here is called **Mel frequency cepstral coefficients** or MFCC for short.

![MFCC pipeline](mfcc.png)

To see what exactly is goin on, go to the `audio` directory of the `edison` repository and launch the mfcc example.

```bash
./main.py mfcc host
```

Multiple plots should pop up. Close all except the one titled _Own implementation_. In the first graph the raw audio sample is shown with the red area indicating the current window locaiton.
The audio that is processed in chunks of 1024 samples. This chunk is first transformed to the frequency domain using FFT and the magnitude is kept. This is shown in the graph at the bottom left.
We then map these powers to the mel scale using triangular overlapping windows. This is the step where the transformation to the logarithmic perception of human hearing is done. 
Notice the overlapping triangles in the top right graph?

[![](mfcc-tut.png)](mfcc-tut.png)

Each triangle contains a band of frequencies. The lower frequencies are resolved in greater detail (smaller distance between triangle tips), similar to our hearing that is more sensitive to changes in frequencies in the lower end of the spectrum. 
The log of these values is then transformed with a discrete cosine transform. This is the compression step mentioned earlier. The DCT is used in almost all digital media such as JPG, MPEG, MP3 and so forth to compress digital signals. The use of cosine functions as base functions allows for fewer coefficients to be required to approximate the signal. 
Or put differently: The DCT compresses the most relevant information of the input signal in its lower ouput coefficients. 
We can now take, say 13, of the lowest coefficients and set the others to zero and have a good approximation of our input.

We now have the coefficients of a frame of 1024 samples, which corresponds to 64ms when sampling at 16kHz. If we take a keyword, say "Edison", it can be up to one second long. This is why this process is repeated for the length of the network input. Issue the following command to gain some insight on how these coefficients look for different keywords:

```bash
./main.py train keras plot
```

[![](dataset.png)](dataset.png)

The colormaps of the coefficients would make great art! Speaking of art, couldn't we train a network to recognize keywords in these images? And this is where the neural network comes in.

### Neural Network
This is where unknown territory begins for me. 

[![](cnn.png)](cnn.png)

## Data Acquisition

```bash
./main.py acquire acq
```

[![](acquire.png)](acquire.png)


## Training

```bash
./main.py train keras train
```

## Implementation

[![](cube.png)](cube.png)

## Testing



