import React, { useEffect, useState } from "react";
import {
  TextInput,
  Button,
  Group,
  Paper,
  Divider,
  Input,
  Grid,
} from "@mantine/core";
import axios from "axios";
import { DownloadSimple } from "@phosphor-icons/react";
import NavCom from "../NavCom";
import ManageStock from "./ManageStocksNav";
import CustomBreadcrumbs from "../../../../components/Breadcrumbs";
import { compounderRoute } from "../../../../routes/health_center";

function AddMedicine() {
  const [submit, setSubmit] = useState(false);
  const [med, setMed] = useState("");
  const [thres, setthres] = useState("");
  const [brand, setBrand] = useState("");
  const [constit, setconstit] = useState("");
  const [manu, setmanu] = useState("");
  const [pack, setpack] = useState("");
  const [reportfile, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmit(true);
    const token = localStorage.getItem("authToken");
    try {
      const response = await axios.post(
        compounderRoute,
        {
          new_medicine: med,
          threshold: thres,
          brand_name: brand,
          constituents: constit,
          manufacture_name: manu,
          packsize: pack,
          add_medicine: 1,
        },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        },
      );
      console.log(response.data);
      setSubmit(false);
    } catch (err) {
      console.log(err);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    console.log("CHANGE");
    console.log(reportfile);
  };

  useEffect(() => {
    if (reportfile) {
      console.log("State Updated:", reportfile);
    }
  }, [reportfile]);

  const handleUpload = async () => {
    if (!reportfile) return;
    const token = localStorage.getItem("authToken");
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target.result.split(",")[1]; // remove "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,"

      const response = await axios.post(
        compounderRoute,
        {
          add_medicine_excel: 1,
          file_data: base64Data,
          filename: reportfile.name,
        },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        },
      );
      console.log(response.data);
      if (response.data.status === 1) {
        alert("added medicine successfully");
        window.location.reload();
      }
    };

    reader.readAsDataURL(reportfile); // reads as base64
  };

  const handelgetfile = async () => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await axios.post(
        compounderRoute,
        { get_file: 1, file_id: -1 },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
          responseType: "blob",
        },
      );
      const blob = response.data;
      const fileURL = URL.createObjectURL(blob);
      window.open(fileURL, "_blank");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      <CustomBreadcrumbs />
      <NavCom />
      <ManageStock />
      <Paper
        withBorder
        shadow="md"
        radius="md"
        p="lg"
        style={{ maxWidth: "2000px", margin: "20px auto", width: "100%" }}
      >
        {/* Insert Data using Excel Section */}
        <div
          style={{
            textAlign: "center",
            fontSize: "1.8rem",
            fontWeight: "bold",
            marginBottom: "1rem",
            color: "#15abff",
          }}
        >
          Insert Data using Excel File
        </div>

        <Group position="center" mt="lg">
          <Input
            type="file"
            label="add Medicine using excel"
            id="report"
            placeholder="Choose File"
            mb="lg"
            accept=".xlsx"
            style={{ width: "30%" }}
            onChange={handleFileChange}
          />
          <Button
            onClick={handleUpload}
            style={{ backgroundColor: "#15ABFF", color: "white" }}
          >
            Submit
          </Button>
          <Button
            variant="outline"
            leftIcon={<DownloadSimple size={20} />}
            style={{
              borderColor: "#15ABFF",
              color: "#15ABFF",
            }}
            onClick={handelgetfile}
          >
            Download Example
          </Button>
        </Group>

        <Divider my="lg" label="OR" labelPosition="center" />

        {/* Medicine Details Form */}
        <form onSubmit={handleSubmit}>
          <Grid gutter="sm">
            <Grid.Col span={6}>
              <TextInput
                label="Medicine Name"
                placeholder="Enter medicine name"
                required
                value={med}
                onChange={(e) => setMed(e.target.value)}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <TextInput
                label="Threshold"
                placeholder="Enter threshold value"
                required
                value={thres}
                onChange={(e) => setthres(e.target.value)}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <TextInput
                label="Brand Name"
                placeholder="Enter brand name"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <TextInput
                label="Constituents"
                placeholder="Enter constituents"
                required
                value={constit}
                onChange={(e) => setconstit(e.target.value)}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <TextInput
                label="Manufacturer Name"
                placeholder="Enter manufacturer name"
                required
                value={manu}
                onChange={(e) => setmanu(e.target.value)}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <TextInput
                label="Pack Size"
                placeholder="Enter pack size"
                required
                value={pack}
                onChange={(e) => setpack(e.target.value)}
              />
            </Grid.Col>
          </Grid>

          <Group position="right" mt="lg">
            <Button
              type="submit"
              style={{
                backgroundColor: "#15ABFF",
                color: "white",
                margin: "auto",
                display: "block",
              }}
            >
              {submit ? "Submitting..." : "Submit"}
            </Button>
          </Group>
        </form>
      </Paper>
    </>
  );
}

export default AddMedicine;
