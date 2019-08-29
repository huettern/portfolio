---
weight: 2
title: "FPGA for Power Electronics Control"
layout: project
description: ""
nav_heading: "ETH Reasearch Assistant"
thumbnail: "eth/converter.png"
case_short_title: "Control of Power Electronics using FPGA and Zynq"
case_title: "Control of Power Electronics using FPGA and Zynq"
case_subtitle: "ETH Research Assistant"
case_description: "Based on a simulation and multiple research papers I implemented a PI control algorithm and a complex PWM modulator in FPGA fabric and CPU to control a high power cascaded H-Bridge converter."
case_feature_img: "eth/converter.png"
feature_img_caption: "Source: [https://pes.ee.ethz.ch/research/research-and-thesis-projects/ac-dc-converters/AC-DC-Converters-3.html](https://pes.ee.ethz.ch/research/research-and-thesis-projects/ac-dc-converters/AC-DC-Converters-3.html)"
case_summary: ""
team: ["Noah Hütter"]
roles: ["Research Assistant"]
methods: ["VHDL/C, Xilinx Zynq, Cocotb, Markdown"]
button_links:
    - link: "https://pes.ee.ethz.ch"
      faicon: "fas fa-link"
      text: "ETH Power Electronic Systems Laboratory"
testimonial_enable: false
testimonial: "testimonial"
testimonial_photo: "diip/diip-cover.png"
testimonial_author: "John Robert Palomo"
testimonial_subtitle: "Co-founder, Cope"
date: 2019-08-28T03:29:08-07:00
draft: true
---

# Abstract
Based on a simulation and multiple research papers I implemented a PI control algorithm and a complex PWM modulator in FPGA fabric and CPU to control a high power cascaded H-Bridge converter.
The result are two IP cores that are controlled over an AXI4Lite interface by the CPU, both with PWM modulators, one having a PI controller built in and the other multi channel ADC support.
A low level C driver can be used to communicate with the cores from the ARM CPU on the Zynq SoC.

# Methods
All hardware code is written in VHDL and simulated using the open source VHDL vimulatur [ghdl][ghdl].
Testbenches are written in Python to be used with the [Cocotb][cocotb] testbench environment.
This workflow enabled fast verification because the stimuli generation of complex interfaces such as AXI4 is already built into Cocotb.

![](wave.png)

The documentation is written in Markdown.
Escpecially register documentation is vital when developing AXI4 IP cores. 
By writing in Markdown language I could make use of version control and the automatic linting of the version control server.

# Hardware
A Xilinx Zynq FPGA + CPU system on chip is used for the project.
It allows for the time critical parts can be implemented in hardware and the computation intensive task to be executed by the CPU.
Furthermore a wide range of communication peripherals built into the SoC enables easy communication.

[ghdl]: http://ghdl.free.fr/
[cocotb]: https://cocotb.readthedocs.io/en/latest/