---
weight: 1
title: "BA Thesis | diip"
description: ""
nav_heading: "Cope Case Study"
thumbnail: "diip/diip-cover-thumb.png"
case_short_title: "FPGA for Enhanced Image Processing"
case_title: "Distributed FPGA for Enhanced Image Processing"
case_subtitle: "Bachelor's Thesis"
case_description: "Together with a fellow student we implemented an image processing algorithm on multiple FPGAs to accelerate image processing. Thanks to my implementaton of a full Ethernet stack, the solution is scalable on a network."
case_feature_img: "diip/diip-cover.png"
case_summary: ""
team: ["Noah Hütter", "Jan Stocker"]
roles: ["Ethernet communication", "Image Processing"]
methods: ["VHDL/C++", "Vivado HLS/VHDL"]
button_links:
    - link: "https://github.com/hargorin/diip"
      faicon: "fab fa-github"
      text: "View GitHub Page"
    - link: "https://github.com/hargorin/diip/releases/download/v3.1/p6_diip_huetter_stocker.pdf"
      faicon: "fa fa-download"
      text: "Download Report"
testimonial_enable: false
testimonial: "testimonial"
testimonial_photo: "diip/diip-cover.png"
testimonial_author: "John Robert Palomo"
testimonial_subtitle: "Co-founder, Cope"
date: 2019-03-11T03:29:08-07:00
draft: false
---

# Abstract
In the world of self-driving cars and virtual reality games it is becoming
increasingly important to represent digitally what we see.
Therefore, using high resolution
cameras, images of the environment have been recorded.
These large images are processed to be presented three dimensionally. 
This image processing task needs to be accelerated to get a fast work flow. 
A dedicated hardware approach using Field Programmable Gate Arrays (FPGA) was
implemented that is scalable onto multiple FPGAs.

In a first approach High Level Synthesis was used to describe a Wallis local contrast enhancement filter in C/C++ language that was then synthesized to hardware description language. In order to further improve throughput a VHDL solution was implemented. A memory management unit was introduced to cache necessary image data to reduce Ethernet bandwidth usage.

The result is an image
processing core and a file transfer protocol stack on top of the User Datagram
Protocol (UDP) to transfer the images from a computer to the FPGA over gigabit Ethernet. 
The Wallis filter core processes data at a rate of one
pixel per clock at 125MHz which corresponds to 125 megapixels per second. 
Studies on scalability show how the processing load can be distributed onto multiple FPGA on a local area network and benchmarks present the performance against CPU based image processing.

With some additions, workload distribution is possible. This study proves 
that a dedicated hardware approach for image processing is possible and will
speed up the process of creating virtual representations of reality.

