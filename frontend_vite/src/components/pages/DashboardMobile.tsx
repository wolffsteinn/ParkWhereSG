import { useState, useEffect } from "react";
import axios from "axios";
import { v4 as uuid } from "uuid";
import { Button, Container } from "@mantine/core";
import { Link } from "react-router-dom";
import { db } from "../../Firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "../firebaseContext/FirebaseContext";
import { createStyles, Table, ScrollArea } from "@mantine/core";
import { IconTrash } from "@tabler/icons";
import { Modal } from "@mantine/core";

const useStyles = createStyles((theme) => ({
  header: {
    position: "sticky",
    top: 0,
    backgroundColor:
      theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
    transition: "box-shadow 150ms ease",

    "&::after": {
      content: '""',
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      borderBottom: `1px solid ${
        theme.colorScheme === "dark"
          ? theme.colors.dark[3]
          : theme.colors.gray[2]
      }`,
    },
  },

  scrolled: {
    boxShadow: theme.shadows.sm,
  },
}));

type SavedInfo = {
  userID: string;
  carparkID: string;
  id: string;
};

type CarparkDetails = {
  Agency: string;
  Area: string;
  AvailableLots: number;
  CarParkID: string;
  Development: string;
  Location: string;
  LotType: string;
  id: string;
  userEmail: string;
};

const DashboardMobile = () => {
  const { classes, cx } = useStyles();
  const [scrolled, setScrolled] = useState(false);
  const [saved, setSaved] = useState<SavedInfo[]>([]);
  const [ltaCarparkAvail, setLtaCarparkAvail] = useState<CarparkDetails[]>([]);
  const savedCollectionRef = collection(db, "favourites");
  const { user } = useAuth();
  const [opened, setOpened] = useState(false);

  //track browser size
  const [tableWidth, setTableWidth] = useState<number>(700);
  const [screenSize, setScreenSize] = useState<{
    dynamicWidth: number;
    dynamicHeight: number;
  }>({
    dynamicWidth: window.innerWidth,
    dynamicHeight: window.innerHeight,
  });

  const setDimension = () => {
    setScreenSize({
      dynamicWidth: window.innerWidth,
      dynamicHeight: window.innerHeight,
    });
  };
  useEffect(() => {
    window.addEventListener("resize", setDimension);
    if (screenSize.dynamicWidth > 390) {
      setTableWidth(700);
    } else if (screenSize.dynamicWidth <= 390) {
      setTableWidth(400);
    }

    console.log(screenSize);
    return () => {
      window.removeEventListener("resize", setDimension);
    };
  }, [screenSize]);

  // to get the most updated saved information from the user
  const updateList = async () => {
    const data = await getDocs(savedCollectionRef);
    setSaved(data.docs.map((doc: any) => ({ ...doc.data(), id: doc.id })));
  };

  useEffect(() => {
    updateList();
  }, []);

  const deleteData = async (id: string) => {
    const data = doc(db, "favourites", id);
    await deleteDoc(data);
    setOpened(true);
    updateList();
  };

  useEffect(() => {
    // recall api to re-render list after deletion
    axios
      .get("http://localhost:3000")
      .then((res) => setLtaCarparkAvail(res.data))
      .catch((err) => console.log(err));
  }, [saved]);

  return (
    <>
      <>
        {/* Modal lets user know that they have clicked on the favourites button
      reduces likelihood of them double-clicking  */}
        <Modal
          withCloseButton={false}
          opened={opened}
          onClose={() => setOpened(false)}
        >
          Deleted!
        </Modal>
      </>
      <Container sx={{ maxWidth: 1000 }} mx="auto">
        <h2>User Dashboard</h2>
        <h3>Your saved carparks</h3>
        <ScrollArea
          sx={{ height: 300 }}
          onScrollPositionChange={({ y }) => setScrolled(y !== 0)}
        >
          <Table sx={{ width: `${tableWidth}` }}>
            <thead
              className={cx(classes.header, { [classes.scrolled]: scrolled })}
            >
              <tr>
                <th>Carpark Location</th>
                <th>Lots Available</th>
                <th>Delete?</th>
              </tr>
            </thead>
            <tbody>
              {/* combining the map of ltaCarparkAvail and saved so that the documentId from firestore is accessible */}
              {ltaCarparkAvail
                .map((lot) => {
                  let savedID = saved.find(
                    (el) => el.carparkID === lot.CarParkID
                  );
                  if (savedID?.id && savedID.userID) {
                    lot.id = savedID.id;
                    lot.userEmail = savedID.userID;
                  }
                  return lot;
                })
                .filter((lot) => lot.id !== undefined && lot.LotType === "C")
                .map((lot) => (
                  <tr key={uuid()}>
                    {lot.userEmail === user?.email ? (
                      <>
                        <td>{lot.Development}</td>
                        <td>{lot.AvailableLots}</td>
                        <td>
                          <IconTrash onClick={() => deleteData(lot.id)} />
                        </td>
                      </>
                    ) : null}
                  </tr>
                ))}
            </tbody>
          </Table>
        </ScrollArea>

        <Button>
          <Link to="/logout">Sign out</Link>
        </Button>
      </Container>
    </>
  );
};

export default DashboardMobile;
