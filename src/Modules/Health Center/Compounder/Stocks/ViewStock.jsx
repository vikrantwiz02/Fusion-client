import React, { useEffect, useState } from "react";
import {
  Pagination,
  Paper,
  Table,
  Title,
  Loader,
  Center,
  Text,
} from "@mantine/core";
import axios from "axios";
import NavCom from "../NavCom";
import ManageStock from "./ManageStocksNav";
import CustomBreadcrumbs from "../../../../components/Breadcrumbs";
import { compounderRoute } from "../../../../routes/health_center";

function ViewStock() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [activePage, setPage] = useState(1);
  const [viewStock, setView] = useState([]);

  const fetchStock = async (pagenumber) => {
    setLoading(true);
    const token = localStorage.getItem("authToken");
    try {
      const response = await axios.post(
        compounderRoute,
        {
          page_stock_view: pagenumber,
          search_view_stock: search,
          datatype: "manage_stock_view",
        },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        },
      );
      setView(response.data.report_stock_view);
      setTotalPages(response.data.total_pages_stock_view);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const setCurrentPage = (e) => {
    setPage(e);
    fetchStock(e);
  };

  useEffect(() => {
    fetchStock(1);
  }, []);

  return (
    <>
      <CustomBreadcrumbs />
      <NavCom />
      <ManageStock />
      <br />
      <Paper shadow="xl" p="xl" withBorder>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchStock(1);
            }}
          >
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              style={{
                width: "130%",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "5px",
                fontSize: "16px",
              }}
            />
          </form>

          <button
            onClick={() => window.print()}
            style={{
              padding: "10px 20px",
              backgroundColor: "#15ABFF",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Download
          </button>
        </div>

        <Paper shadow="xl" p="xl" withBorder>
          <Title
            order={5}
            style={{
              textAlign: "center",
              margin: "0 auto",
              color: "#15abff",
            }}
          >
            Stocks
          </Title>
          <br />

          {loading ? (
            <Center style={{ height: "150px" }}>
              <Loader size="lg" color="blue" />
            </Center>
          ) : viewStock.length === 0 ? (
            <Center style={{ padding: "20px" }}>
              <Text color="dimmed" size="md">
                No Data Found
              </Text>
            </Center>
          ) : (
            <Table
              withTableBorder
              withColumnBorders
              highlightOnHover
              striped
              horizontalSpacing="md"
              verticalSpacing="sm"
              style={{ overflowX: "auto" }}
            >
              <thead>
                <tr style={{ backgroundColor: "#E0F2FE", textAlign: "center" }}>
                  <th>Medicine</th>
                  <th>Supplier</th>
                  <th>Expiry Date</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {viewStock.map((item, index) => (
                  <tr key={index}>
                    <td style={{ textAlign: "center" }}>{item.medicine_id}</td>
                    <td style={{ textAlign: "center" }}>{item.supplier}</td>
                    <td style={{ textAlign: "center" }}>{item.Expiry_date}</td>
                    <td style={{ textAlign: "center" }}>{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Paper>

        {!loading && viewStock.length > 0 && (
          <Pagination
            value={activePage}
            onChange={setCurrentPage}
            total={totalPages}
            style={{ marginTop: "20px", margin: "auto", width: "fit-content" }}
          />
        )}
      </Paper>

      <style>
        {`
          @media print {
            nav,
            button,
            form,
            .mantine-Pagination-root {
              display: none !important;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th,
            td {
              border: 1px solid #000;
              padding: 8px;
            }
          }
        `}
      </style>
    </>
  );
}

export default ViewStock;
