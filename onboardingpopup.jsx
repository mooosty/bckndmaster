// src/components/popup/onboarding-popup/OnboardingPopup.js

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { editUserProfileAPI, getTwitterUserAPI, getUsersAPI } from "../../../api-services/userApis";
import { addProjectAPI, addMemberAPI } from "../../../api-services/projectApis";
import axios from "axios";
import "./onboardingPopup.scss";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M16.44 8.8999C20.04 9.2099 21.51 11.0599 21.51 15.1099V15.2399C21.51 19.7099 19.72 21.4999 15.25 21.4999H8.73998C4.26998 21.4999 2.47998 19.7099 2.47998 15.2399V15.1099C2.47998 11.0899 3.92998 9.2399 7.46998 8.9099"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M12 15V3.62" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15.35 5.85L12 2.5L8.65002 5.85" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CustomImageUploader = ({ image, setFieldValue }) => {
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Create FormData and append file
        const formData = new FormData();
        formData.append("file", file);

        // Upload to the API
        const response = await axios.post(`${import.meta.env.VITE_IMAGE_UPLOAD_BASE_URL}/`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        // Set both the file and the returned URL
        setFieldValue("image", {
          file: file,
          preview: URL.createObjectURL(file),
          url: response.data.image_url, // Store the returned URL
        });

        toast.success("Image uploaded successfully");
      } catch (error) {
        console.error("Error uploading image:", error);
        toast.error("Failed to upload image");
      }
    }
  };

  return (
    <div
      className={`image_uploader ${image?.preview ? "has_image" : ""}`}
      onClick={() => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = handleImageChange;
        input.click();
      }}
    >
      {image?.preview ? (
        <>
          <img src={image.preview} alt="Project" />
          <div className="image_overlay">
            <span className="change_image_text">Change Image</span>
          </div>
        </>
      ) : (
        <div className="upload_content">
          <div className="upload_icon">
            <UploadIcon />
          </div>
          <div className="upload_text">
            <div className="main_text">Upload Project Image</div>
            <div className="sub_text">PNG, JPG up to 5MB</div>
          </div>
        </div>
      )}
    </div>
  );
};

const OnboardingPopup = ({ open, handleClose, userId, user }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { authDetails } = useSelector((state) => state.auth);

  // const [step, setStep] = useState(1);
  const [customRole, setCustomRole] = useState("");
  const [customNiche, setCustomNiche] = useState("");

  const [secondaryCity, setSecondaryCity] = useState("");
  const [contentType, setContentType] = useState("");

  const token = localStorage.getItem("dynamic_authentication_token")?.replace(/['"]+/g, "");

  const [formData, setFormData] = useState({
    // Basic Profile Info (Step 1)
    firstname: "",
    lastname: "",
    email: "",
    primary_city: "",

    secondary_city: [],
    roles: [],
    projects: [
      {
        name: "",
        role: "",
        twitter: "",
        website: "",
        niches: [],
        image: null,
      },
    ],

    isContentCreator: false,
    contentCreatorDescription: "",
    contentPlatforms: [],
    contentTypes: [],
    platformLinks: {},
    FDV: [],
    criterias: [],
    equityOrToken: "",
    investmentProfile: {
      isInvestor: "never",
      roundTypes: [],
      ticketSize: "",
    },
    bio: "",
    short_bio: "",
    extensive_bio: "",
  });

  const [touchedFields, setTouchedFields] = useState({
    name: false,
    role: false,
    twitter: false,
    website: false,
  });

  const predefinedRoles = [
    "Founder",
    "C-level",
    "BD",
    "Community Manager",
    "Collab Manager",
    "Outreach Team",
    "KOL",
    "Ambassador",
    "Content Creator",
    "Alpha Caller",
    "Venture Capital",
    "Developer",
    "Designer",
    "Advisor",
  ];

  const predefinedNiches = [
    "DeFi",
    "Gaming",
    "NFT",
    "Social",
    "Infrastructure",
    "DAO",
    "ai",
    "rwa",
    "DePin",
    "L1/L2/L3",
    "Data",
    "IP",
    "Web2 Brand entering Web3",
    "Exchange",
    "Market Maker",
  ];
  const contentTypes = ["Thread Writing", "Video Content", "Technical Content", "Educational Content"];
  const contentPlatforms = ["Twitter", "YouTube", "LinkedIn", "Medium", "TikTok", "Instagram"];
  const roundTypes = ["Pre-seed", "Seed", "Private", "Strategic", "Public"];
  const ticketSizes = [">$5k", "5k-10k", "10k-25k", "25k-100k", "100k-250k", "250k-500k", "1mil+"];
  const FDV = ["<$5mil", "$5mil-$10mil", "$10mil-$20mil", "$20mil-$50mil", "$50mil-$100mil", "$100mil-$200mil", "$200mil+"];
  const factors = [
    "Tier 1 VC backing",
    "Experienced team",
    "Passionate team",
    "Founder's vision",
    "Founder's leadership and charisma",
    "Product-market fit",
    "Deal terms: TGE date",
    "Deal terms: TGE unlock and vesting schedule",
    "Partnerships",
    "Ambassadors / advisors / KOLs involved",
    "Number of users",
    "Community size and passion / involvement",
    "GTM strategy and marketing plans",
    "Launchpads involved",
    "CEX listings",
  ];

  useEffect(() => {
    const fetchTwitterUser = async () => {
      const {
        payload: { data },
      } = await dispatch(getTwitterUserAPI(authDetails.user.verifiedCredentials[1].oauthAccountId)).then((res) => res);

      const info = data[0];

      if (info.onboarding_steps === 7) {
        navigate("/dashboard");
      }
      setFormData((prev) => ({
        ...prev,
        onboarding_steps: info.onboarding_steps || 1,
        firstname: info.firstname || "",
        lastname: info.lastname || "",
        email: info.email || "",
        primary_city: info.primary_city || "",

        secondary_city: info.secondary_city ? info.secondary_city.split(",") : [],

        roles: info.roles ? info.roles.split(",") : [],
        projects: [
          {
            name: "",
            role: "",
            twitter: "",
            website: "",
            niches: [],
            image: null,
          },
        ],
        isContentCreator: 1,
        contentCreatorDescription: info.contentCreatorDescription || "",
        contentPlatforms: [],
        contentTypes: [],
        platformLinks: {},
        FDV: info.FDV ? info.FDV.split(",") : [],
        criterias: info.criterias ? info.criterias.split(",") : [],
        equityOrToken: info.equityOrToken || "",
        investmentProfile: {
          isInvestor: "never",
          roundTypes: [],
          ticketSize: "",
        },
        bio: info.bio || "",

        extensive_bio: info.extensive_bio || "",
        short_bio: info.short_bio || info.bio || "",
      }));
    };

    fetchTwitterUser();
  }, [dispatch]);

  // useEffect(() => {
  //   if (authDetails?.user?.verifiedCredentials?.[1]) {
  //     const twitterData = authDetails.user.verifiedCredentials[1];
  //     setFormData((prev) => ({
  //       ...prev,
  //       firstname: twitterData.publicIdentifier || "",
  //       email: authDetails.user.email || "",
  //     }));
  //   }
  // }, [authDetails]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProjectInputChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.map((project, i) => (i === index ? { ...project, [field]: value } : project)),
    }));
  };

  const addNewProject = () => {
    setFormData((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          name: "",
          role: "",
          twitter: "",
          website: "",
          niches: [],
          image: null,
        },
      ],
    }));
  };

  const removeProject = (index) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    try {
      // Save profile data

      const profilePayload = {
        id: userId,
        userData: {
          onboarding_steps: 7,
          firstname: formData.firstname,
          lastname: formData.lastname,
          bio: formData.bio,
          extensive_bio: formData.extensive_bio,
          short_bio: formData.short_bio,
          email: formData.email,
          primary_city: formData.primary_city,
          secondary_city: formData.secondary_city.join(","),
          roles: formData.roles.join(","),
        },
      };

      dispatch(editUserProfileAPI(profilePayload));

      // Save projects
      for (const project of formData.projects) {
        if (project.name) {
          let imageUrl = "";
          if (project.image?.file) {
            const formDataImg = new FormData();
            formDataImg.append("file", project.image.file);
            const response = await axios.post(`${import.meta.env.VITE_IMAGE_UPLOAD_BASE_URL}/`, formDataImg, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            });
            imageUrl = response.data.url;
          }

          const projectPayload = {
            project_name: project.name,
            website: project.website,
            twitter: project.twitter,
            image: imageUrl,
            niches: project.niches.join(","),
            date: new Date().toISOString().split("T")[0],
          };

          const projectResponse = await dispatch(addProjectAPI(projectPayload));

          if (projectResponse.payload?.response?.data?.insertId) {
            const memberPayload = {
              userId: userId,
              projectId: projectResponse.payload.response.data.insertId,
              roles: project.role,
            };
            await dispatch(addMemberAPI(memberPayload));
          }
        }
      }

      handleClose();
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  const handleNextStep = async () => {
    try {
      if (formData.onboarding_steps === 1) {
        // Save basic profile data

        if (!formData.primary_city.length) return;
        const profilePayload = {
          id: userId,
          userData: {
            onboarding_steps: 2,
            firstname: formData.firstname,
            lastname: formData.lastname,
            email: formData.email,
            primary_city: formData.primary_city,
            secondary_city: formData.secondary_city.join(","),
          },
        };

        await dispatch(editUserProfileAPI(profilePayload));
      } else if (formData.onboarding_steps === 2) {
        // Save roles data

        if (!formData.roles.length) return;

        const profilePayload = {
          id: userId,
          userData: {
            onboarding_steps: 3,
            roles: formData.roles.join(","),
          },
        };

        await dispatch(editUserProfileAPI(profilePayload));
      } else if (formData.onboarding_steps === 3) {
        // Save project data
        for (const project of formData.projects) {
          if (project.name && project.role && project.twitter && project.website && project.niches.length) {
            const imageUrl = project.image?.url || "";

            const date = new Date();
            const projectPayload = {
              onboarding_steps: 4,
              project_name: project.name,
              project_info: project.niches.join("#"),
              website: project.website || "",
              twitter: project.twitter || "",
              description: "",
              rating: 0,
              featured: 0,
              image: imageUrl,
              date: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
              synergy_access: true,
              synergy_angles: {},
              investments_access: true,
              investments: {},
            };

            const projectResponse = await dispatch(addProjectAPI(projectPayload));

            if (projectResponse.payload?.response?.data?.insertId) {
              const memberPayload = {
                userId: userId,
                projectId: projectResponse.payload.response.data.insertId,
                roles: project.role,
              };
              await dispatch(addMemberAPI(memberPayload));
            }
          }
        }
      } else if (formData.onboarding_steps === 4) {
        // Only send social media data if user is a content creator

        // ! IMPORTANT IMPORTANT IMPORTANT IMPORTANT
        // @ need to get the media after post

        if (formData.isContentCreator === 0) {
          return toast.error("Select one at least ");
        }

        if ([1, 2].includes(formData.isContentCreator)) {
          if (formData.contentPlatforms.length === 0) {
            return toast.error("Please add at least one social media platform");
          }
          if (Object.values(formData.platformLinks).some((value) => value.length === 0)) {
            return toast.error("Please social media cannot be empty ");
          }
          if (formData.contentTypes.length === 0) {
            return toast.error("Please select at least one content type");
          }
        }

        const prepareData = {
          platformLinks: Object.fromEntries(Object.entries(formData.platformLinks).filter(([key, value]) => value.length > 0)),
          contentTypes: formData.contentTypes,
        };

        const socialsPayload = {
          contentCreatorDescription: formData.contentCreatorDescription,

          onboarding_steps: 5,
          _uid: userId,
          main_socials: prepareData.platformLinks,
          content_type: prepareData.contentTypes,
        };

        console.log(socialsPayload);

        await axios.post("https://winwinsocietyweb3.com/api/ambassadors/socials", socialsPayload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      } else if (formData.onboarding_steps === 5) {
        // Save investment profile data

        // ! IMPORTANT IMPORTANT IMPORTANT IMPORTANT IMPORTANT
        // ! add the  FDV to the DATABASE

        const profilePayload = {
          id: userId,
          userData: {
            onboarding_steps: 6,
            investment_thesis: JSON.stringify(formData.investmentProfile.roundTypes),
            ticket_size: JSON.stringify(formData.investmentProfile.ticketSize),
            investment_stage: JSON.stringify(formData.investmentProfile.roundTypes),
            investment_description: formData.investmentProfile.description || "",
            previous_investments: formData.investmentProfile.previousInvestments || "",
            equityOrToken: formData.equityOrToken,
            FDV: formData.FDV.join(","),
            criterias: formData.criterias.join(","),
          },
        };

        await dispatch(editUserProfileAPI(profilePayload));
      } else if (formData.onboarding_steps === 6) {
        // Save bio data
        const profilePayload = {
          id: userId,
          userData: {
            onboarding_steps: 7,
            bio: formData.bio || "",
            extensive_bio: formData.extensive_bio || "",
            short_bio: formData.short_bio || "",
            firstname: formData.firstname || "",
            lastname: formData.lastname || "",
            email: formData.email || "",
            primary_city: formData.primary_city || "",
            secondary_city: formData.secondary_city ? formData.secondary_city.join(",") : "",
            roles: formData.roles.join(",") || "",
          },
        };

        await dispatch(editUserProfileAPI(profilePayload));
      }
      setFormData((prev) => ({ ...prev, onboarding_steps: prev.onboarding_steps + 1 }));
    } catch (error) {
      console.error("Error saving data:", error);
      toast.error("Failed to save data");
    }
  };

  const handleSkipStep = async () => {
    const response = await fetch(`https://winwinsocietyweb3.com/api/users/${userId}/onboarding`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ step: 4 }),
    });

    setFormData((prev) => ({ ...prev, onboarding_steps: prev.onboarding_steps + 1 }));
  };

  const renderStepContent = () => {
    switch (formData.onboarding_steps) {
      case 1:
        return (
          <div className="step_content">
            <h2>Tell us about you</h2>
            <p>Basic profile information</p>
            {/* <div className="section_container">
              <div className="form_group">
                <input type="text" name="firstname" placeholder="First Name*" value={formData.firstname} onChange={handleInputChange} required />
                <input type="text" name="lastname" placeholder="Last Name*" value={formData.lastname} onChange={handleInputChange} />
                <input type="email" name="email" placeholder="Email*" value={formData.email} disabled />
                <input
                  type="text"
                  name="primary_city"
                  placeholder="Primary City : Where are you based"
                  value={formData.primary_city}
                  onChange={handleInputChange}
                  required
                />
                <input type="text" name="secondary_city" placeholder="Secondary City" value={formData.secondary_city} onChange={handleInputChange} />
              </div>
            </div> */}

            {formData.projects.map((project, index) => (
              <div key={index} className=" " style={{ position: "relative" }}>
                <div className="form_group_onboarding  section_container">
                  <input type="text" name="firstname" placeholder="First Name*" value={formData.firstname} onChange={handleInputChange} required />
                  <input type="text" name="lastname" placeholder="Last Name" value={formData.lastname} onChange={handleInputChange} />
                  <input type="email" name="email" placeholder="Email*" value={formData.email} disabled />
                </div>

                <div className="section_container">
                  <h3>Where are you based : </h3>
                  <div style={{ marginTop: "-0.7rem", fontSize: "0.7rem" }}>
                    We'll send you VIP invites to our partners events such as Forbes and Karate Combat, and soon enough The Win-Win Society events!
                  </div>

                  <div className="form_group_onboarding" style={{ paddingTop: "0.4rem" }}>
                    <input
                      // style={window.innerWidth > 680 ? {} : { width: "calc(100% + 2rem)" }}
                      type="text"
                      name="primary_city"
                      placeholder="Primary City *"
                      value={formData.primary_city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="custom_input">
                    <input
                      type="text"
                      name="secondary_city"
                      placeholder="Secondary City"
                      value={secondaryCity}
                      onChange={(e) => setSecondaryCity(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          if (secondaryCity.trim()) {
                            setFormData((prev) => ({
                              ...prev,
                              secondary_city: prev.secondary_city.includes(secondaryCity) ? prev.secondary_city : [...prev.secondary_city, secondaryCity],
                            }));
                            setSecondaryCity("");
                          }
                          e.target.blur();
                          e.target.focus();
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (secondaryCity.trim()) {
                          setFormData((prev) => ({
                            ...prev,
                            secondary_city: prev.secondary_city.includes(secondaryCity) ? prev.secondary_city : [...prev.secondary_city, secondaryCity],
                          }));
                          setSecondaryCity("");
                        }
                      }}
                      disabled={!secondaryCity.trim()}
                    >
                      Add
                    </button>
                  </div>

                  <div className="onboarding_options ">
                    <div className="custom_options">
                      {formData.secondary_city.map((city) => (
                        <div key={city} className={`option custom ${predefinedNiches.includes(city) ? "selected" : ""}`}>
                          <span>{city}</span>
                          <span
                            className="delete-btn"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                secondary_city: prev.secondary_city.filter((city) => city !== secondaryCity),
                              }));
                            }}
                          >
                            ×
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 2:
        return (
          <div className="step_content">
            <h2>You are a...</h2>
            <div className="section_container">
              <div className="chips_grid">
                {predefinedRoles.map((role) => (
                  <div
                    key={role}
                    className={`chip ${formData.roles.includes(role) ? "selected" : ""}`}
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        roles: prev.roles.includes(role) ? prev.roles.filter((r) => r !== role) : [...prev.roles, role],
                      }));
                    }}
                  >
                    {role}
                  </div>
                ))}
              </div>

              <div className="custom_input">
                <input type="text" value={customRole} onChange={(e) => setCustomRole(e.target.value)} placeholder="Add custom role" />
                <button
                  onClick={() => {
                    if (customRole.trim()) {
                      setFormData((prev) => ({
                        ...prev,
                        roles: [...prev.roles, customRole.trim()],
                      }));
                      setCustomRole("");
                    }
                  }}
                  disabled={!customRole.trim()}
                >
                  Add
                </button>
              </div>

              <div className="onboarding_options ">
                <div className="custom_options">
                  {formData.roles
                    .filter((role) => !predefinedRoles.includes(role))
                    .map((role) => (
                      <div key={role} className={`option custom ${predefinedRoles.includes(role) ? "selected" : ""}`}>
                        <span>{role}</span>

                        <span
                          className="delete-btn"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              roles: prev.roles.filter((r) => r !== role),
                            }));
                          }}
                        >
                          ×
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step_content">
            <h2>Which project do you represent?</h2>
            {formData.projects.map((project, index) => (
              <div key={index} className="section_container" style={{ position: "relative" }}>
                <h3>Project {index + 1}</h3>
                {index > 0 && (
                  <button className="remove_project" onClick={() => removeProject(index)}>
                    Remove Project
                  </button>
                )}

                <CustomImageUploader image={project.image} setFieldValue={(_, value) => handleProjectInputChange(index, "image", value)} />

                <div className="form_group_onboarding">
                  <input
                    type="text"
                    placeholder="Project Name*"
                    value={project.name}
                    onChange={(e) => handleProjectInputChange(index, "name", e.target.value)}
                    onBlur={() => setTouchedFields((prev) => ({ ...prev, name: true }))}
                    style={{
                      border: touchedFields.name && !project.name ? "1px solid salmon" : "1px solid #ccc",
                    }}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Your Role in Project*"
                    value={project.role}
                    onChange={(e) => handleProjectInputChange(index, "role", e.target.value)}
                    onBlur={() => setTouchedFields((prev) => ({ ...prev, role: true }))}
                    style={{
                      border: touchedFields.role && !project.role ? "1px solid salmon" : "1px solid #ccc",
                    }}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Twitter Link*"
                    value={project.twitter}
                    onChange={(e) => handleProjectInputChange(index, "twitter", e.target.value)}
                    onBlur={() => setTouchedFields((prev) => ({ ...prev, twitter: true }))}
                    style={{
                      border: touchedFields.twitter && !project.twitter ? "1px solid salmon" : "1px solid #ccc",
                    }}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Official Website*"
                    value={project.website}
                    onChange={(e) => handleProjectInputChange(index, "website", e.target.value)}
                    onBlur={() => setTouchedFields((prev) => ({ ...prev, website: true }))}
                    style={{
                      border: touchedFields.website && !project.website ? "1px solid salmon" : "1px solid #ccc",
                    }}
                    required
                  />
                </div>

                <div className="section_container">
                  <h3>Project Niches</h3>
                  <div className="chips_grid">
                    {predefinedNiches.map((niche) => (
                      <div
                        key={niche}
                        className={`chip ${project.niches.includes(niche) ? "selected" : ""}`}
                        onClick={() => {
                          const updatedNiches = project.niches.includes(niche) ? project.niches.filter((n) => n !== niche) : [...project.niches, niche];
                          handleProjectInputChange(index, "niches", updatedNiches);
                        }}
                      >
                        {niche}
                      </div>
                    ))}
                  </div>

                  <div className="custom_input">
                    <input type="text" value={customNiche} onChange={(e) => setCustomNiche(e.target.value)} placeholder="Add custom niche" />
                    <button
                      onClick={() => {
                        if (customNiche.trim()) {
                          handleProjectInputChange(index, "niches", [...project.niches, customNiche.trim()]);
                          setCustomNiche("");
                        }
                      }}
                      disabled={!customNiche.trim()}
                    >
                      Add
                    </button>
                  </div>

                  <div className="onboarding_options ">
                    <div className="custom_options">
                      {project.niches
                        .filter((niche) => !predefinedNiches.includes(niche))
                        .map((niche) => (
                          <div key={niche} className={`option custom ${predefinedNiches.includes(niche) ? "selected" : ""}`}>
                            <span>{niche}</span>
                            <span
                              className="delete-btn"
                              onClick={() => {
                                handleProjectInputChange(
                                  index,
                                  "niches",
                                  project.niches.filter((n) => n !== niche)
                                );
                              }}
                            >
                              ×
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button className="add_project_button" onClick={addNewProject}>
              Add Another Project
            </button>
          </div>
        );

      case 4:
        return (
          <div className="step_content">
            <h2>Content Creation</h2>
            <p>Are you interested in being an Ambassador (can be different levels of involvement) for projects you like?</p>
            <div className="section_container">
              <div className="content_creator_section">
                <div className="toggle_section" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                  <label>
                    <input
                      type="radio"
                      style={{ marginRight: "0.5rem" }}
                      checked={formData.isContentCreator === 1}
                      onChange={() => {
                        setFormData((prev) => ({
                          ...prev,
                          isContentCreator: 1,
                          contentPlatforms: [],
                          contentTypes: [],
                          platformLinks: {},
                        }));
                      }}
                    />
                    Yes, I create content
                  </label>
                  <label>
                    <input
                      type="radio"
                      checked={formData.isContentCreator === 2}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          isContentCreator: 2,
                          contentPlatforms: [],
                          contentTypes: [],
                          platformLinks: {},
                        }));
                      }}
                    />
                    It's not my main focus, but open to tweet about projects I really like
                  </label>
                  <label>
                    <input
                      type="radio"
                      checked={formData.isContentCreator === 3}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          isContentCreator: 3,
                          contentPlatforms: [],
                          contentTypes: [],
                          platformLinks: {},
                        }));
                      }}
                    />
                    I never do any type of content (completely behind the scenes)
                  </label>
                </div>

                {(formData.isContentCreator === 1 || formData.isContentCreator === 2) && (
                  <>
                    <h3>Select Platforms</h3>
                    <div className="platforms_section">
                      {contentPlatforms.map((platform) => (
                        <div key={platform} className="platform_container">
                          <div
                            className={`option ${formData.contentPlatforms.includes(platform) ? "selected" : ""}`}
                            onClick={() => {
                              const isSelected = formData.contentPlatforms.includes(platform);
                              setFormData((prev) => ({
                                ...prev,
                                contentPlatforms: isSelected ? prev.contentPlatforms.filter((p) => p !== platform) : [...prev.contentPlatforms, platform],
                                platformLinks: { ...prev.platformLinks, [platform]: isSelected ? "" : "" },
                              }));
                            }}
                          >
                            {platform}
                          </div>
                          {formData.contentPlatforms.includes(platform) && (
                            <div className="platform_input_container">
                              <input
                                type="text"
                                placeholder={`Enter your ${platform} profile URL`}
                                value={formData.platformLinks[platform] || ""}
                                onChange={(e) => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    platformLinks: {
                                      ...prev.platformLinks,
                                      [platform]: e.target.value || "",
                                    },
                                  }));
                                }}
                                className="platform_link_input"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <h3>Content Types</h3>

                    <div className="chips_grid">
                      {contentTypes.map((type) => (
                        <div
                          key={type}
                          className={`chip ${formData.contentTypes.includes(type) ? "selected" : ""}`}
                          onClick={() => {
                            const updatedContentTypes = formData.contentTypes.includes(type)
                              ? formData.contentTypes.filter((t) => t !== type)
                              : [...formData.contentTypes, type];
                            setFormData((prev) => ({
                              ...prev,
                              contentTypes: updatedContentTypes,
                            }));
                          }}
                        >
                          {type}
                        </div>
                      ))}
                    </div>

                    {/* <div className="options_grid">
                      {contentTypes.map((type) => (
                        <div
                          key={type}
                          className={`option ${formData.contentTypes.includes(type) ? "selected" : ""}`}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              contentTypes: prev.contentTypes.includes(type) ? prev.contentTypes.filter((t) => t !== type) : [...prev.contentTypes, type],
                            }));
                          }}
                        >
                          {type}
                        </div>
                      ))}
                    </div> */}
                    {/* /********************************  */}

                    <div className="custom_input">
                      <input
                        type="text"
                        name="content_type"
                        placeholder="Add content type"
                        value={contentType}
                        onChange={(e) => setContentType(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            if (contentType.trim()) {
                              setFormData((prev) => ({
                                ...prev,
                                contentTypes: prev.contentTypes.includes(contentType) ? prev.contentTypes : [...prev.contentTypes, contentType],
                              }));
                              setContentType("");
                            }
                            e.target.blur();
                            e.target.focus();
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (contentType.trim()) {
                            setFormData((prev) => ({
                              ...prev,
                              contentTypes: prev.contentTypes.includes(contentType) ? prev.contentTypes : [...prev.contentTypes, contentType],
                            }));
                            setContentType("");
                          }
                        }}
                        disabled={!contentType.trim()}
                      >
                        Add
                      </button>
                    </div>
                    <div className="onboarding_options ">
                      <div className="custom_options">
                        {formData.contentTypes
                          .filter((niche) => !contentTypes.includes(niche))
                          .map((niche) => (
                            <div key={niche} className={`option custom ${contentTypes.includes(niche) ? "selected" : ""}`}>
                              <span>{niche}</span>
                              <span
                                className="delete-btn"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    contentTypes: prev.contentTypes.filter((n) => n !== niche),
                                  }))
                                }
                              >
                                ×
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="custom_input" style={{ marginTop: "1rem" }}>
                      <textarea
                        type="text"
                        placeholder="Describe yourself as a content creator"
                        value={formData.contentCreatorDescription}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            contentCreatorDescription: e.target.value,
                          }))
                        }
                        rows={5}
                      />
                    </div>

                    {/* ******************************** */}
                  </>
                )}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="step_content">
            <h2>Investment Profile</h2>

            <p>Do you invest in projects?</p>
            <div className="section_container">
              <div className="chips_grid">
                {["Yes", "Sometimes", "Never"].map((option) => (
                  <div
                    key={option}
                    className={`chip ${formData.investmentProfile.isInvestor === option.toLowerCase() ? "selected" : ""}`}
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        investmentProfile: {
                          ...prev.investmentProfile,
                          isInvestor: option.toLowerCase(),
                          roundTypes: [],
                          ticketSize: [],
                        },
                      }));
                    }}
                  >
                    {option}
                  </div>
                ))}
              </div>

              {formData.investmentProfile.isInvestor !== "never" && (
                <>
                  <div className="section_container">
                    <h3>Preferred Round Types</h3>
                    <div className="chips_grid">
                      {roundTypes.map((type, index) => (
                        <div
                          key={type}
                          className={`chip ${formData.investmentProfile.roundTypes.includes(type) ? "selected" : ""}`}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              investmentProfile: {
                                ...prev.investmentProfile,
                                roundTypes: prev.investmentProfile.roundTypes.includes(type)
                                  ? prev.investmentProfile.roundTypes.filter((t) => t !== type)
                                  : [...prev.investmentProfile.roundTypes, type],
                              },
                            }));
                          }}
                        >
                          <div style={{ display: "flex", gap: "0.1rem" }}>
                            <div style={{ backgroundColor: "transparent" }}>
                              <div
                                style={{
                                  width: formData.investmentProfile.roundTypes?.includes(type) ? "0.8rem" : undefined,
                                  height: formData.investmentProfile.roundTypes?.includes(type) ? "0.8rem" : undefined,
                                  borderRadius: "50%",

                                  border: formData.investmentProfile.roundTypes?.includes(type) ? "1.2rem" : undefined,
                                }}
                              >
                                {formData.investmentProfile.roundTypes.includes(type) && formData.investmentProfile.roundTypes.indexOf(type) + 1}
                              </div>
                            </div>
                            <div>{type}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="section_container">
                    <h3>Average ticket size (select all relevant)</h3>
                    <div className="chips_grid">
                      {ticketSizes.map((size, index) => (
                        <div
                          key={size}
                          className={`chip ${formData.investmentProfile.ticketSize.includes(size) ? "selected" : ""}`}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              investmentProfile: {
                                ...prev.investmentProfile,
                                ticketSize: prev.investmentProfile.ticketSize.includes(size)
                                  ? prev.investmentProfile.ticketSize.filter((t) => t !== size)
                                  : [...prev.investmentProfile.ticketSize, size],
                              },
                            }));
                          }}
                        >
                          <div style={{ display: "flex", gap: "0.1rem" }}>
                            <div style={{ backgroundColor: "transparent" }}>
                              <div
                                style={{
                                  width: formData.investmentProfile.ticketSize?.includes(size) ? "0.8rem" : undefined,
                                  height: formData.investmentProfile.ticketSize?.includes(size) ? "0.8rem" : undefined,
                                  borderRadius: "50%",

                                  border: formData.investmentProfile.ticketSize?.includes(size) ? "1.2rem" : undefined,
                                }}
                              >
                                {formData.investmentProfile.ticketSize.includes(size) && formData.investmentProfile.ticketSize.indexOf(size) + 1}
                              </div>
                            </div>
                            <div>{size}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="section_container">
                    <h3>Preferred FDV (select all relevant)</h3>
                    <div className="chips_grid">
                      {FDV.map((item, index) => (
                        <div
                          key={item}
                          className={`chip ${formData.FDV.includes(item) ? "selected" : ""}`}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              FDV: prev.FDV.includes(item) ? prev.FDV.filter((t) => t !== item) : [...prev.FDV, item],
                            }));
                          }}
                        >
                          <div style={{ display: "flex", gap: "0.1rem" }}>
                            <div style={{ backgroundColor: "transparent" }}>
                              <div
                                style={{
                                  width: formData.FDV?.includes(item) ? "0.8rem" : undefined,
                                  height: formData.FDV?.includes(item) ? "0.8rem" : undefined,
                                  borderRadius: "50%",

                                  border: formData.FDV?.includes(item) ? "1.2rem" : undefined,
                                }}
                              >
                                {formData.FDV.includes(item) && formData.FDV.indexOf(item) + 1}
                              </div>
                            </div>
                            <div>{item}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="section_container">
                    <h3>Your top criterias (rank them) </h3>
                    <div className="chips_grid">
                      {factors.map((item, index) => (
                        <div
                          key={item}
                          className={`chip ${formData.criterias.includes(item) ? "selected" : ""}`}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              criterias: prev.criterias.includes(item) ? prev.criterias.filter((t) => t !== item) : [...prev.criterias, item],
                            }));
                          }}
                        >
                          <div style={{ display: "flex", gap: "0.1rem" }}>
                            <div style={{ backgroundColor: "transparent" }}>
                              <div
                                style={{
                                  width: formData.criterias?.includes(item) ? "0.8rem" : undefined,
                                  height: formData.criterias?.includes(item) ? "0.8rem" : undefined,
                                  borderRadius: "50%",

                                  border: formData.criterias?.includes(item) ? "1.2rem" : undefined,
                                }}
                              >
                                {formData.criterias.includes(item) && formData.criterias.indexOf(item) + 1}
                              </div>
                            </div>
                            <div>{item}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="section_container">
                    <h3>Do you invest in equity as well? </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input
                          type="radio"
                          name="equityOrToken"
                          id="equityAndToken"
                          value="equityAndToken"
                          checked={formData.equityOrToken === "equityAndToken"}
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              equityOrToken: e.target.value,
                            }));
                          }}
                        />
                        <label htmlFor="equityAndToken">Interested in both equity and tokens</label>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input
                          type="radio"
                          name="equityOrToken"
                          id="tokenOnly"
                          value="tokenOnly"
                          checked={formData.equityOrToken === "tokenOnly"}
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              equityOrToken: e.target.value,
                            }));
                          }}
                        />
                        <label htmlFor="tokenOnly">Tokens only</label>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="step_content">
            <h2>Tell us about yourself</h2>
            <p>Write a short bio</p>
            <div className="section_container">
              {false ? (
                <>
                  <h3> bio</h3>
                  <div className="form_group_onboarding">
                    <textarea
                      name="bio"
                      placeholder="Describe yourself briefly..."
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={3}
                      className="full-width"
                    />
                  </div>
                </>
              ) : (
                <>
                  <h3>Short bio</h3>
                  <div className="form_group_onboarding">
                    <textarea
                      name="short_bio"
                      placeholder="Describe yourself briefly..."
                      value={formData.short_bio}
                      onChange={handleInputChange}
                      rows={3}
                      className="full-width"
                    />
                  </div>
                  <h3 style={{ marginTop: "1.5rem" }}>Extensive bio</h3>
                  <div className="form_group_onboarding">
                    <textarea
                      name="extensive_bio"
                      placeholder="Tell us more about you. Background, your current focus and interests, and how The Win-Win Society can help you get there..."
                      value={formData.extensive_bio}
                      onChange={handleInputChange}
                      rows={6}
                      className="full-width"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleGoBack = () => {
    setFormData((prev) => ({ ...prev, onboarding_steps: prev.onboarding_steps - 1 }));

    const profilePayload = {
      id: userId,
      userData: {
        onboarding_steps: formData.onboarding_steps - 1,
      },
    };

    dispatch(editUserProfileAPI(profilePayload));
  };

  // if (!open) return null;

  const totalSteps = 6;

  return (
    <div className="popup_overlay">
      <div className="onboarding_popup_content">
        <div className="step_indicator">
          {Array.from({ length: totalSteps }, (_, i) => (
            <React.Fragment key={i}>
              <div className={`step ${formData.onboarding_steps >= i + 1 ? "active" : ""}`}>{i + 1}</div>
              {i < totalSteps - 1 && <div className="step_line" style={{ "--progress": formData.onboarding_steps > i + 1 ? "100%" : "0%" }}></div>}
            </React.Fragment>
          ))}
        </div>

        {renderStepContent()}

        <div className="button_group">
          {formData.onboarding_steps > 1 && (
            <button className="back_button" onClick={handleGoBack}>
              Back
            </button>
          )}
          {formData.onboarding_steps < totalSteps ? (
            <>
              {formData.onboarding_steps === 3 && (
                <button className="next_button" onClick={handleSkipStep}>
                  Skip
                </button>
              )}

              <button
                // className={
                //   (formData.onboarding_steps === 1 && (!formData.firstname || !formData.lastname || !formData.email)) ||
                // (formData.onboarding_steps === 2 && formData.roles.length === 0) ||
                //   (formData.onboarding_steps === 3 && formData.projects.some((p) => !p.name || !p.role))
                //     ? "next_button next_button_disabled"
                //     : "next_button"
                // }
                onClick={handleNextStep}
                disabled={
                  (formData.onboarding_steps === 2 && formData.roles.length === 0) ||
                  (formData.onboarding_steps === 4 &&
                    (formData.isContentCreator === 0 ||
                      ([1, 2].includes(formData.isContentCreator) &&
                        (formData.contentPlatforms.length === 0 ||
                          Object.values(formData.platformLinks).some((value) => value.length === 0) ||
                          formData.contentTypes.length === 0)))) ||
                  (formData.onboarding_steps === 5 &&
                    (formData.investmentProfile.isInvestor.toLowerCase() !== "never"
                      ? formData.investmentProfile.roundTypes.length === 0 ||
                        formData.FDV.length === 0 ||
                        formData.criterias.length === 0 ||
                        formData.equityOrToken.length === 0 ||
                        formData.investmentProfile.ticketSize.length === 0
                      : false))

                  // ||

                  // (formData.onboarding_steps === 5 &&
                  //   (formData.investmentProfile.roundTypes.length === 0 ||
                  //     formData.FDV.length === 0 ||
                  //     formData.criterias.length === 0 ||
                  //     formData.equityOrToken))
                }
                // disabled={
                //   (formData.onboarding_steps === 1 && (!formData.firstname || !formData.lastname || !formData.email)) ||
                //   (formData.onboarding_steps === 2 && formData.roles.length === 0) ||
                //   (formData.onboarding_steps === 3 && formData.projects.some((p) => !p.name || !p.role))
                // }
              >
                Next
              </button>
            </>
          ) : (
            // <button className="submit_button" onClick={handleSubmit} disabled={!(formData.short_bio.trim() && formData.extensive_bio.trim())}>
            <button className="submit_button" onClick={handleSubmit} disabled={!formData.bio.trim()}>
              Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPopup;
