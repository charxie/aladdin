/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { Avatar, Button, Dropdown, Input, Menu, Modal, Space } from 'antd';
import dayjs from 'dayjs';
import 'antd/dist/antd.css';
import styled from 'styled-components';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import { showError, showInfo } from './helpers';
import { CloudFileInfo, ObjectType, User } from './types';
import CloudFilePanel from './panels/cloudFilePanel';
import Spinner from './components/spinner';
import AccountSettingsPanel from './panels/accountSettingsPanel';
import i18n from './i18n/i18n';
import MainToolBarButtons from './mainToolBarButtons';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const ButtonsContainer = styled.div`
  position: absolute;
  top: 0;
  right: 10px;
  margin: 0;
  padding-bottom: 0;
  padding-top: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
  z-index: 9;
`;

export interface MainToolBarProps {
  viewOnly: boolean;
}

const MainToolBar = ({ viewOnly = false }: MainToolBarProps) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const user = useStore(Selector.user);
  const exportContent = useStore(Selector.exportContent);
  const showCloudFilePanel = useStore(Selector.showCloudFilePanel);
  const showAccountSettingsPanel = useStore(Selector.showAccountSettingsPanel);
  const cloudFile = useStore(Selector.cloudFile);
  const saveCloudFileFlag = useStore(Selector.saveCloudFileFlag);
  const listCloudFilesFlag = useStore(Selector.listCloudFilesFlag);
  const showCloudFileTitleDialog = useStore(Selector.showCloudFileTitleDialog);
  const importContent = useStore(Selector.importContent);
  const createEmptyFile = useStore(Selector.createEmptyFile);
  const changed = useStore(Selector.changed);
  const localContentToImportAfterCloudFileUpdate = useStore(Selector.localContentToImportAfterCloudFileUpdate);
  const undoManager = useStore(Selector.undoManager);

  const [loading, setLoading] = useState(false);
  const [updateFlag, setUpdateFlag] = useState(false);
  const [cloudFileArray, setCloudFileArray] = useState<any[]>([]);
  const [title, setTitle] = useState<string>(cloudFile ?? 'My Aladdin File');
  const [titleDialogVisible, setTitleDialogVisible] = useState(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const cloudFiles = useRef<CloudFileInfo[] | void>();
  const firstCallUpdateCloudFile = useRef<boolean>(true);
  const firstCallListCloudFiles = useRef<boolean>(true);

  const params = new URLSearchParams(window.location.search);
  const lang = { lng: language };

  useEffect(() => {
    const config = {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID,
    };
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    } else {
      firebase.app(); // if already initialized, use that one
    }
    // do not use firebase.auth().currentUser - currentUser might be null because the auth object has not finished initializing.
    // If you use an observer to keep track of the user's sign-in status, you don't need to handle this case.
    firebase.auth().onAuthStateChanged((u) => {
      if (u) {
        setCommonStore((state) => {
          if (state.user) {
            state.user.uid = u.uid;
            state.user.displayName = u.displayName;
            state.user.email = u.email;
            state.user.photoURL = u.photoURL;
          }
        });
      }
      init(); // load the initial state after we recognize the user
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cloudFiles.current) {
      const arr: any[] = [];
      cloudFiles.current.forEach((f, i) => {
        arr.push({
          key: i.toString(),
          title: f.fileName,
          time: dayjs(new Date(f.timestamp)).format('MM/DD/YYYY hh:mm a'),
          timestamp: f.timestamp,
          action: '',
          email: f.email,
          owner: f.owner,
        });
      });
      arr.sort((a, b) => b.timestamp - a.timestamp);
      setCloudFileArray(arr);
    }
    // FIXME: React says that the dependency of the mutable cloudFiles.current is unnecessary,
    //  but we need this for the code to work.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudFiles.current]);

  useEffect(() => {
    if (firstCallUpdateCloudFile.current) {
      firstCallUpdateCloudFile.current = false;
    } else {
      updateCloudFile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveCloudFileFlag]);

  useEffect(() => {
    if (firstCallListCloudFiles.current) {
      firstCallListCloudFiles.current = false;
    } else {
      listMyCloudFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listCloudFilesFlag]);

  useEffect(() => {
    setTitleDialogVisible(showCloudFileTitleDialog);
  }, [showCloudFileTitleDialog]);

  useEffect(() => {
    setTitle(cloudFile ?? 'My Aladdin File');
  }, [cloudFile]);

  const init = () => {
    const userid = params.get('userid');
    const title = params.get('title');
    if (userid && title) {
      openCloudFile(userid, title);
    }
  };

  const resetToSelectMode = () => {
    setCommonStore((state) => {
      state.objectTypeToAdd = ObjectType.None;
    });
  };

  const signIn = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase
      .auth()
      .signInWithPopup(provider)
      .then((result) => {
        setCommonStore((state) => {
          if (result.user) {
            state.user.uid = result.user.uid;
            state.user.email = result.user.email;
            state.user.displayName = result.user.displayName;
            state.user.photoURL = result.user.photoURL;
            registerUser({ ...state.user }).then(() => {
              console.log(state.user);
            });
          }
        });
      })
      .catch((error) => {
        console.log('Error: ', error);
      });
    resetToSelectMode();
  };

  const registerUser = async (user: User): Promise<any> => {
    const firestore = firebase.firestore();
    const found = await firestore
      .collection('users')
      .get()
      .then((querySnapshot) => {
        for (let doc of querySnapshot.docs) {
          if (doc.id === user.email) {
            return true;
          }
        }
        return false;
      });
    if (!found && user.email) {
      firestore
        .collection('users')
        .doc(user.email)
        .set({
          email: user.email,
          uid: user.uid,
          photoURL: user.photoURL,
          displayName: user.displayName,
        })
        .then((docRef) => {
          console.log('Document written with ID: ', docRef);
        })
        .catch((error) => {
          console.error('Error adding document: ', error);
        });
    }
  };

  const signOut = () => {
    firebase
      .auth()
      .signOut()
      .then(() => {
        setCommonStore((state) => {
          state.user.uid = null;
          state.user.email = null;
          state.user.displayName = null;
          state.user.photoURL = null;
          state.cloudFile = undefined; // if there is a current cloud file
          state.showAccountSettingsPanel = false;
          state.showCloudFilePanel = false;
        });
      })
      .catch((error) => {
        console.log('Error: ', error);
      });
  };

  const saveToCloud = (tlt: string) => {
    const t = tlt.trim();
    if (t.length > 0) {
      setLoading(true);
      if (user.email) {
        try {
          const doc = firebase.firestore().collection('users').doc(user.email);
          if (doc) {
            doc
              .collection('files')
              .doc(t)
              .set(exportContent())
              .then(() => {
                setLoading(false);
                setCommonStore((state) => {
                  state.cloudFile = t;
                  state.changed = false;
                });
                if (localContentToImportAfterCloudFileUpdate) {
                  if (localContentToImportAfterCloudFileUpdate === 'CREATE_NEW_FILE') {
                    createEmptyFile();
                  } else {
                    importContent(localContentToImportAfterCloudFileUpdate);
                  }
                }
                if (showCloudFilePanel) {
                  fetchMyCloudFiles().then(() => {
                    setUpdateFlag(!updateFlag);
                  });
                }
              })
              .catch((error) => {
                console.log('Error saving file:', error);
              });
          }
        } catch (e) {
          console.log(e);
        }
      }
      setTitleDialogVisible(false);
    } else {
      showError(i18n.t('menu.file.SavingAbortedMustHaveValidTitle', lang) + '.');
    }
  };

  const openCloudFileWithSaveReminder = (userid: string, title: string) => {
    if (changed) {
      Modal.confirm({
        title: i18n.t('shared.DoYouWantToSaveChanges', lang),
        icon: <ExclamationCircleOutlined />,
        onOk: () => {
          if (cloudFile) {
            saveToCloud(cloudFile);
          }
          openCloudFile(userid, title);
        },
        onCancel: () => openCloudFile(userid, title),
        okText: i18n.t('word.Yes', lang),
        cancelText: i18n.t('word.No', lang),
      });
    } else {
      openCloudFile(userid, title);
    }
  };

  const openCloudFile = (userid: string, title: string) => {
    if (userid && title) {
      undoManager.clear();
      setLoading(true);
      firebase
        .firestore()
        .collection('users')
        .doc(userid)
        .collection('files')
        .doc(title)
        .get()
        .then((doc) => {
          const data = doc.data();
          if (data) {
            importContent(data, title);
            setLoading(false);
          } else {
            showInfo('Sorry, ' + title + ' was not found. It may have been deleted by its owner.');
          }
        })
        .catch((error) => {
          console.log('Error opening file:', error);
        });
    }
  };

  const fetchMyCloudFiles = async () => {
    if (!user.email) return;
    setLoading(true);
    // fetch owner's file information from the cloud
    cloudFiles.current = await firebase
      .firestore()
      .collection('users')
      .doc(user.email)
      .collection('files')
      .get()
      .then((querySnapshot) => {
        const a: CloudFileInfo[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          a.push({
            timestamp: data.timestamp,
            fileName: doc.id,
            email: data.email,
            owner: data.owner,
            uuid: data.docid,
          } as CloudFileInfo);
        });
        setLoading(false);
        return a;
      })
      .catch((error) => {
        console.log('Error getting files:', error);
      });
  };

  const listMyCloudFiles = () => {
    if (user.email) {
      fetchMyCloudFiles().then(() => {
        setCommonStore((state) => {
          state.showCloudFilePanel = true;
        });
      });
    }
  };

  const deleteCloudFile = (userid: string, title: string) => {
    firebase
      .firestore()
      .collection('users')
      .doc(userid)
      .collection('files')
      .doc(title)
      .delete()
      .then(() => {
        setCloudFileArray(
          cloudFileArray.filter((e) => {
            return e.email !== userid || e.title !== title;
          }),
        );
        setCommonStore((state) => {
          if (title === state.cloudFile) {
            state.cloudFile = undefined;
          }
        });
      })
      .catch((error) => {
        console.log('Error deleting file:', error);
      });
  };

  const renameCloudFile = (userid: string, oldTitle: string, newTitle: string) => {
    const files = firebase.firestore().collection('users').doc(userid).collection('files');
    files
      .doc(oldTitle)
      .get()
      .then((doc) => {
        if (doc && doc.exists) {
          const data = doc.data();
          if (data) {
            files
              .doc(newTitle)
              .set(data)
              .then(() => files.doc(oldTitle).delete());
          }
        }
      })
      .catch((error) => {
        console.log('Error renaming file:', error);
      });
    for (const f of cloudFileArray) {
      if (f.email === userid && f.title === oldTitle) {
        f.title = newTitle;
        break;
      }
    }
    setCloudFileArray([...cloudFileArray]);
  };

  const gotoAccountSettings = () => {
    setCommonStore((state) => {
      state.showAccountSettingsPanel = true;
    });
  };

  const updateCloudFile = () => {
    if (cloudFile) {
      saveToCloud(cloudFile);
      setTitle(cloudFile);
    }
  };

  const avatarMenu = (
    <Menu>
      <Menu.Item key="account" onClick={gotoAccountSettings}>
        {i18n.t('avatarMenu.AccountSettings', lang)}
      </Menu.Item>
      <Menu.Item key="signOut" onClick={signOut}>
        {i18n.t('avatarMenu.SignOut', lang)}
      </Menu.Item>
    </Menu>
  );

  const onStart = (event: DraggableEvent, uiData: DraggableData) => {
    if (dragRef.current) {
      const { clientWidth, clientHeight } = window.document.documentElement;
      const targetRect = dragRef.current.getBoundingClientRect();
      setBounds({
        left: -targetRect.left + uiData.x,
        right: clientWidth - (targetRect.right - uiData.x),
        top: -targetRect.top + uiData.y,
        bottom: clientHeight - (targetRect?.bottom - uiData.y),
      });
    }
  };

  return viewOnly ? (
    <></>
  ) : (
    <>
      <Modal
        width={500}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('menu.file.SaveAsCloudFile', lang)}
          </div>
        }
        visible={titleDialogVisible}
        onOk={() => {
          const trimmedTitle = title.trim();
          if (trimmedTitle.length > 0) {
            saveToCloud(trimmedTitle);
            setCommonStore((state) => {
              state.cloudFile = trimmedTitle;
              state.showCloudFileTitleDialog = false;
            });
          }
        }}
        confirmLoading={loading}
        onCancel={() => {
          setTitleDialogVisible(false);
          setCommonStore((state) => {
            state.showCloudFileTitleDialog = false;
          });
        }}
        modalRender={(modal) => (
          <Draggable disabled={!dragEnabled} bounds={bounds} onStart={(event, uiData) => onStart(event, uiData)}>
            <div ref={dragRef}>{modal}</div>
          </Draggable>
        )}
      >
        <Space direction={'horizontal'}>
          <label>{i18n.t('word.Title', lang)}:</label>
          <Input
            style={{ width: '400px' }}
            placeholder="Title"
            value={title}
            onPressEnter={() => saveToCloud(title)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setTitle(e.target.value);
            }}
          />
        </Space>
      </Modal>
      {loading && <Spinner />}
      <ButtonsContainer>
        <Space direction="horizontal">
          <MainToolBarButtons />
          <div style={{ verticalAlign: 'middle', paddingBottom: '20px' }}>
            {user.displayName ? (
              <Dropdown overlay={avatarMenu} trigger={['click']}>
                <a
                  className="ant-dropdown-link"
                  onClick={(e) => e.preventDefault()}
                  title={i18n.t('tooltip.clickToAccessCloudTools', lang)}
                >
                  <Avatar size={32} src={user.photoURL} alt={user.displayName} />
                </a>
              </Dropdown>
            ) : (
              <Button type="primary" title={i18n.t('avatarMenu.SignIn', lang)} onClick={signIn}>
                {i18n.t('avatarMenu.SignIn', lang)}
              </Button>
            )}
          </div>
        </Space>
      </ButtonsContainer>
      {showCloudFilePanel && cloudFiles.current && (
        <CloudFilePanel
          cloudFileArray={cloudFileArray}
          openCloudFile={openCloudFileWithSaveReminder}
          deleteCloudFile={deleteCloudFile}
          renameCloudFile={renameCloudFile}
        />
      )}
      {showAccountSettingsPanel && <AccountSettingsPanel />}
    </>
  );
};

export default React.memo(MainToolBar);
