/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import { useStore } from './stores/common';
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/storage';
import { showError, showInfo } from './helpers';
import i18n from './i18n/i18n';
import { Design, DesignProblem } from './types';
import { Util } from './Util';
import { usePrimitiveStore } from './stores/commonPrimitive';

export const removeDesignFromProject = (userid: string, projectTitle: string, design: Design) => {
  const lang = { lng: useStore.getState().language };
  return firebase
    .firestore()
    .collection('users')
    .doc(userid)
    .collection('projects')
    .doc(projectTitle)
    .update({
      designs: firebase.firestore.FieldValue.arrayRemove(design),
    })
    .then(() => {
      showInfo(i18n.t('message.DesignRemovedFromProject', lang) + '.');
    })
    .catch((error) => {
      showError(i18n.t('message.CannotRemoveDesignFromProject', lang) + ': ' + error);
    });
};

export const updateProjectHiddenParameters = (
  userid: string,
  projectTitle: string,
  hiddenParameter: string,
  add: boolean, // true is to add, false is to remove
) => {
  const lang = { lng: useStore.getState().language };
  return firebase
    .firestore()
    .collection('users')
    .doc(userid)
    .collection('projects')
    .doc(projectTitle)
    .update({
      hiddenParameters: add
        ? firebase.firestore.FieldValue.arrayUnion(hiddenParameter)
        : firebase.firestore.FieldValue.arrayRemove(hiddenParameter),
    })
    .then(() => {
      // ignore
    })
    .catch((error) => {
      showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
    });
};

export const updateProjectDescription = (userid: string, projectTitle: string, description: string | null) => {
  const lang = { lng: useStore.getState().language };
  return firebase
    .firestore()
    .collection('users')
    .doc(userid)
    .collection('projects')
    .doc(projectTitle)
    .update({ description })
    .then(() => {
      // ignore
    })
    .catch((error) => {
      showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
    });
};

export const createDesign = (type: string, title: string, thumbnail: string): Design => {
  let design = { title, thumbnail } as Design;
  switch (type) {
    case DesignProblem.SOLAR_PANEL_ARRAY:
      const panelCount = Util.countAllSolarPanels();
      const dailyYield = Util.countAllSolarPanelDailyYields();
      const yearlyYield = Util.countAllSolarPanelYearlyYields();
      const economicParams = useStore.getState().economicsParams;
      const unitCost = economicParams.operationalCostPerUnit;
      const sellingPrice = economicParams.electricitySellingPrice;
      design = {
        unitCost,
        sellingPrice,
        panelCount,
        dailyYield,
        yearlyYield,
        ...design,
        ...useStore.getState().solarPanelArrayLayoutParams,
      };
      break;
    case DesignProblem.SOLAR_PANEL_TILT_ANGLE:
      // TODO: Each row has a different tilt angle
      break;
  }
  return design;
};

// change the design titles of a project based on its current title (used when copying or renaming a project)
export const changeDesignTitles = (projectTitle: string, projectDesigns: Design[] | null): Design[] | null => {
  if (!projectDesigns) return null;
  const newDesigns: Design[] = [];
  // The order of for-of on arrays is guaranteed by the array iterator definition.
  // It will visit the entries in the array in numeric index order
  // So the returned array has the same order as the original array.
  for (const design of projectDesigns) {
    const copy = { ...design };
    copy.title = createDesignTitle(projectTitle, design.title);
    newDesigns.push(copy);
  }
  return newDesigns;
};

// the design title is named after the project title plus the current counter of the project
// for example, "project title 0", "project title 1", etc.
export const createDesignTitle = (projectTitle: string, designTitle: string) => {
  if (designTitle.includes(projectTitle)) return designTitle;
  const index = designTitle.lastIndexOf(' ');
  return projectTitle + designTitle.substring(index);
};

export const getImageData = (image: HTMLImageElement) => {
  const c = document.createElement('canvas');
  c.width = image.width;
  c.height = image.height;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.drawImage(image, 1, 1); // 1 is for padding
  }
  return c.toDataURL();
};

export const copyDesign = (original: string, copy: string, owner: string | null, userid: string) => {
  const lang = { lng: useStore.getState().language };
  firebase
    .firestore()
    .collection('users')
    .doc(owner ?? userid)
    .collection('files')
    .doc(original)
    .get()
    .then((doc) => {
      if (doc.exists) {
        const data = doc.data();
        if (data) {
          firebase
            .firestore()
            .collection('users')
            .doc(userid)
            .collection('files')
            .doc(copy)
            .set(data)
            .then(() => {
              showInfo(i18n.t('message.CloudFileCopied', lang) + ': ' + copy);
            })
            .catch((error) => {
              showError(i18n.t('message.CannotWriteCloudFile', lang) + ': ' + error);
            });
        }
      } else {
        showError(i18n.t('message.CannotReadCloudFile', lang));
      }
    })
    .catch((error) => {
      showError(i18n.t('message.CannotReadCloudFile', lang) + ': ' + error);
    });
};

export const updateProjectDesign = (
  userid: string,
  projectType: string,
  projectTitle: string,
  designTitle: string,
  canvas: HTMLCanvasElement | null,
) => {
  const lang = { lng: useStore.getState().language };
  // First we update the design file by overwriting it with the current content
  return firebase
    .firestore()
    .collection('users')
    .doc(userid)
    .collection('files')
    .doc(designTitle)
    .set(useStore.getState().exportContent())
    .then(() => {
      useStore.getState().set((state) => {
        state.changed = false;
      });
      if (canvas) {
        // update the thumbnail image as well
        const thumbnail = Util.resizeCanvas(canvas, 200).toDataURL();
        firebase
          .firestore()
          .collection('users')
          .doc(userid)
          .collection('projects')
          .doc(projectTitle)
          .get()
          .then((doc) => {
            if (doc.exists) {
              const data = doc.data();
              if (data) {
                const updatedDesigns: Design[] = [];
                updatedDesigns.push(...data.designs);
                // Get the index of the design to be modified by the title
                let index = -1;
                for (const [i, d] of updatedDesigns.entries()) {
                  if (d.title === designTitle) {
                    index = i;
                    break;
                  }
                }
                // If found, update the design in the array
                if (index >= 0) {
                  // Update design from the current parameters and results and the new thumbnail
                  updatedDesigns[index] = createDesign(projectType, designTitle, thumbnail);
                  // Finally, upload the updated design array back to Firestore
                  firebase
                    .firestore()
                    .collection('users')
                    .doc(userid)
                    .collection('projects')
                    .doc(projectTitle)
                    .update({ designs: updatedDesigns })
                    .then(() => {
                      // ignore
                    })
                    .catch((error) => {
                      showError(i18n.t('message.CannotUpdateProject', lang) + ': ' + error);
                    })
                    .finally(() => {
                      // Update the cached array in the local storage via the common store
                      useStore.getState().set((state) => {
                        state.projectDesigns = updatedDesigns;
                      });
                      usePrimitiveStore.setState((state) => {
                        state.updateProjectsFlag = !state.updateProjectsFlag;
                      });
                    });
                }
              }
            }
          })
          .catch((error) => {
            showError(i18n.t('message.CannotFetchProjectData', lang) + ': ' + error);
          })
          .finally(() => {
            // ignore
          });
      }
    });
};
