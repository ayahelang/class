/**
 * Silverhawk Class — data layer (classroom_* only)
 * Shares the same Supabase project as webgal; does not touch gallery_* tables for writes
 * except optional read of session / profiles for identity.
 */
(function (global) {
  function cfg() {
    return global.GALLERY_SUPABASE || {};
  }
  function enabled() {
    const c = cfg();
    return !!(c.url && c.anonKey && String(c.url).trim() && String(c.anonKey).trim());
  }
  function client() {
    if (!enabled()) return null;
    if (!global.supabase || !global.supabase.createClient) return null;
    if (!global.__classSb) {
      global.__classSb = global.supabase.createClient(
        String(cfg().url).replace(/\/$/, ""),
        cfg().anonKey
      );
    }
    return global.__classSb;
  }

  async function getSession() {
    const sb = client();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data.session || null;
  }

  async function signInWithGoogle() {
    const sb = client();
    if (!sb) throw new Error("Supabase belum siap");
    const redirectTo = location.origin + location.pathname;
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) throw error;
  }

  
  async function getHomeBannerUrl() {
    const sb = client();
    if (!sb) {
      try {
        return localStorage.getItem("cl_home_banner") || "";
      } catch (e) {
        return "";
      }
    }
    try {
      const { data, error } = await sb
        .from("classroom_settings")
        .select("value")
        .eq("key", "home_banner_url")
        .maybeSingle();
      if (!error && data && data.value) return String(data.value);
    } catch (e) {}
    try {
      return localStorage.getItem("cl_home_banner") || "";
    } catch (e2) {
      return "";
    }
  }

  async function setHomeBannerUrl(url) {
    const sb = client();
    const u = String(url || "").trim();
    try {
      localStorage.setItem("cl_home_banner", u);
    } catch (e) {}
    if (!sb) return u;
    try {
      const { error } = await sb.from("classroom_settings").upsert(
        { key: "home_banner_url", value: u, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
      if (error) throw error;
    } catch (e) {
      // tabel belum ada — tetap pakai localStorage
      console.warn("[class] classroom_settings", e.message || e);
    }
    return u;
  }

  async function uploadHomeBanner(file) {
    const sb = client();
    if (!file) throw new Error("File kosong");
    if (!sb) throw new Error("Supabase belum siap");
    const session = await getSession();
    if (!session) throw new Error("Login dulu");
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = "classroom/banners/home-" + Date.now() + "." + ext;
    // coba bucket classroom-assets, fallback chat-images / public
    const buckets = ["classroom-assets", "chat-images", "gallery"];
    let lastErr = null;
    for (var i = 0; i < buckets.length; i++) {
      try {
        const { error } = await sb.storage.from(buckets[i]).upload(path, file, {
          upsert: true,
          contentType: file.type || "image/jpeg",
        });
        if (error) throw error;
        const { data } = sb.storage.from(buckets[i]).getPublicUrl(path);
        const url = data && data.publicUrl;
        if (url) {
          await setHomeBannerUrl(url);
          return url;
        }
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error("Upload banner gagal");
  }

  async function canEditHomeBanner() {
    const session = await getSession();
    if (!session || !session.user) return false;
    if (isAdminEmail(session.user.email)) return true;
    try {
      const p = await getMyProfile();
      if (p && (p.is_admin || p.role === "admin" || p.role === "teacher" || p.role === "pengajar")) return true;
    } catch (e) {}
    return false;
  }

  async function signOut() {
    const sb = client();
    if (sb) await sb.auth.signOut();
  }

  function onAuthStateChange(cb) {
    const sb = client();
    if (!sb || typeof cb !== "function") return function () {};
    const { data } = sb.auth.onAuthStateChange(function (event, session) {
      try {
        cb(event, session);
      } catch (e) {}
    });
    return function () {
      try {
        data.subscription.unsubscribe();
      } catch (e) {}
    };
  }

  function isAdminEmail(email) {
    const list = (cfg().adminEmails || []).map(function (e) {
      return String(e || "").toLowerCase();
    });
    return list.indexOf(String(email || "").toLowerCase()) >= 0;
  }

  async function getMyProfile() {
    const sb = client();
    const session = await getSession();
    if (!sb || !session || !session.user) return null;
    try {
      const { data } = await sb
        .from("gallery_profiles")
        .select("id,display_name,linked_student_name,is_admin,email,role")
        .eq("id", session.user.id)
        .maybeSingle();
      return data || null;
    } catch (e) {
      return null;
    }
  }

  async function listCourses({ activeOnly } = { activeOnly: true }) {
    const sb = client();
    if (!sb) return [];
    let q = sb.from("classroom_courses").select("*").order("sort_order").order("title");
    if (activeOnly) q = q.eq("active", true);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }

  async function getCourse(id) {
    const sb = client();
    if (!sb) return null;
    const { data, error } = await sb.from("classroom_courses").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  }

  async function deleteCourse(id) {
    const sb = client();
    if (!sb) throw new Error("Supabase belum dikonfigurasi");
    const { error } = await sb.from("classroom_courses").delete().eq("id", id);
    if (error) throw new Error(error.message || JSON.stringify(error));
  }
  async function deleteModule(id) {
    const sb = client();
    const { error } = await sb.from("classroom_modules").delete().eq("id", id);
    if (error) throw new Error(error.message || JSON.stringify(error));
  }
  async function deleteMaterial(id) {
    const sb = client();
    const { error } = await sb.from("classroom_materials").delete().eq("id", id);
    if (error) throw new Error(error.message || JSON.stringify(error));
  }
  async function deleteAssignment(id) {
    const sb = client();
    const { error } = await sb.from("classroom_assignments").delete().eq("id", id);
    if (error) throw new Error(error.message || JSON.stringify(error));
  }

  async function upsertCourse(row) {
    const sb = client();
    if (!sb) throw new Error("DB belum siap");
    const payload = {
      code: row.code || null,
      title: row.title,
      description: row.description || "",
      cover_url: row.cover_url || "",
      teacher_name: row.teacher_name || "",
      teacher_user_id: row.teacher_user_id || null,
      active: row.active !== false,
      sort_order: row.sort_order || 0,
      updated_at: new Date().toISOString(),
    };
    if (row.id) {
      const { data, error } = await sb.from("classroom_courses").update(payload).eq("id", row.id).select("*").single();
      if (error) throw error;
      return data;
    }
    const { data, error } = await sb.from("classroom_courses").insert(payload).select("*").single();
    if (error) throw error;
    return data;
  }

  async function listModules(courseId) {
    const sb = client();
    if (!sb) return [];
    const { data, error } = await sb
      .from("classroom_modules")
      .select("*")
      .eq("course_id", courseId)
      .order("sort_order");
    if (error) throw error;
    return data || [];
  }

  async function upsertModule(row) {
    const sb = client();
    if (!sb) throw new Error("DB belum siap");
    const payload = {
      course_id: row.course_id,
      title: row.title,
      description: row.description || "",
      sort_order: row.sort_order || 0,
      published: row.published !== false,
    };
    if (row.id) {
      const { data, error } = await sb.from("classroom_modules").update(payload).eq("id", row.id).select("*").single();
      if (error) throw error;
      return data;
    }
    const { data, error } = await sb.from("classroom_modules").insert(payload).select("*").single();
    if (error) throw error;
    return data;
  }

  async function listMaterials(moduleId) {
    const sb = client();
    if (!sb) return [];
    const { data, error } = await sb
      .from("classroom_materials")
      .select("*")
      .eq("module_id", moduleId)
      .order("sort_order");
    if (error) throw error;
    return data || [];
  }

  async function upsertMaterial(row) {
    const sb = client();
    if (!sb) throw new Error("DB belum siap");
    const payload = {
      module_id: row.module_id,
      title: row.title,
      body: row.body || "",
      material_type: row.material_type || "text",
      content_url: row.content_url || "",
      sort_order: row.sort_order || 0,
      published: row.published !== false,
    };
    if (row.id) {
      const { data, error } = await sb.from("classroom_materials").update(payload).eq("id", row.id).select("*").single();
      if (error) throw error;
      return data;
    }
    const { data, error } = await sb.from("classroom_materials").insert(payload).select("*").single();
    if (error) throw error;
    return data;
  }

  async function listProgressForUser(userId) {
    const sb = client();
    if (!sb || !userId) return [];
    const { data, error } = await sb.from("classroom_progress").select("*").eq("user_id", userId);
    if (error) throw error;
    return data || [];
  }

  async function markMaterialDone(materialId, userId, studentName) {
    const sb = client();
    if (!sb) throw new Error("DB belum siap");
    if (!userId) throw new Error("Login dulu");
    const { data, error } = await sb
      .from("classroom_progress")
      .upsert(
        {
          material_id: materialId,
          user_id: userId,
          student_name: studentName || "",
          completed: true,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "material_id,user_id" }
      )
      .select("*");
    if (error) throw error;
    return data;
  }

  async function listAssignments(courseId) {
    const sb = client();
    if (!sb) return [];
    const { data, error } = await sb
      .from("classroom_assignments")
      .select("*")
      .eq("course_id", courseId)
      .eq("published", true)
      .order("due_at", { ascending: true, nullsFirst: false });
    if (error) throw error;
    return data || [];
  }

  async function upsertAssignment(row) {
    const sb = client();
    if (!sb) throw new Error("DB belum siap");
    const payload = {
      course_id: row.course_id,
      module_id: row.module_id || null,
      title: row.title,
      description: row.description || "",
      max_score: row.max_score != null ? row.max_score : 100,
      due_at: row.due_at || null,
      allow_late: row.allow_late !== false,
      submission_type: row.submission_type || "link",
      published: row.published !== false,
      updated_at: new Date().toISOString(),
    };
    if (row.id) {
      const { data, error } = await sb.from("classroom_assignments").update(payload).eq("id", row.id).select("*").single();
      if (error) throw error;
      return data;
    }
    const { data, error } = await sb.from("classroom_assignments").insert(payload).select("*").single();
    if (error) throw error;
    return data;
  }

  async function getMySubmission(assignmentId, userId) {
    const sb = client();
    if (!sb || !userId) return null;
    const { data, error } = await sb
      .from("classroom_submissions")
      .select("*, classroom_grades(*)")
      .eq("assignment_id", assignmentId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function submitAssignment(row) {
    const sb = client();
    if (!sb) throw new Error("DB belum siap");
    const now = new Date();
    let isLate = false;
    if (row.due_at) {
      isLate = now > new Date(row.due_at);
    }
    const payload = {
      assignment_id: row.assignment_id,
      user_id: row.user_id,
      student_name: row.student_name || "",
      body: row.body || "",
      link_url: row.link_url || "",
      submitted_at: now.toISOString(),
      is_late: isLate,
      status: "submitted",
    };
    // upsert by assignment+user
    const existing = await getMySubmission(row.assignment_id, row.user_id);
    if (existing && existing.id) {
      const { data, error } = await sb
        .from("classroom_submissions")
        .update(payload)
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    }
    const { data, error } = await sb.from("classroom_submissions").insert(payload).select("*").single();
    if (error) throw error;
    return data;
  }

  async function listSubmissions(assignmentId) {
    const sb = client();
    if (!sb) return [];
    const { data, error } = await sb
      .from("classroom_submissions")
      .select("*, classroom_grades(*)")
      .eq("assignment_id", assignmentId)
      .order("submitted_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function gradeSubmission(submissionId, score, maxScore, feedback, grader) {
    const sb = client();
    if (!sb) throw new Error("DB belum siap");
    const payload = {
      submission_id: submissionId,
      score: score,
      max_score: maxScore != null ? maxScore : 100,
      feedback: feedback || "",
      graded_by: grader && grader.id ? grader.id : null,
      graded_by_name: grader && grader.name ? grader.name : "",
      graded_at: new Date().toISOString(),
    };
    const { data, error } = await sb
      .from("classroom_grades")
      .upsert(payload, { onConflict: "submission_id" })
      .select("*")
      .single();
    if (error) throw error;
    await sb.from("classroom_submissions").update({ status: "graded" }).eq("id", submissionId);
    return data;
  }

  global.ClassDB = {
    enabled,
    client,
    getSession,
    getHomeBannerUrl,
    setHomeBannerUrl,
    uploadHomeBanner,
    canEditHomeBanner,
    signInWithGoogle,
    onAuthStateChange,
    signOut,
    isAdminEmail,
    getMyProfile,
    listCourses,
    getCourse,
    upsertCourse,
    deleteCourse,
    deleteModule,
    deleteMaterial,
    deleteAssignment,
    listModules,
    upsertModule,
    listMaterials,
    upsertMaterial,
    listProgressForUser,
    markMaterialDone,
    listAssignments,
    upsertAssignment,
    getMySubmission,
    submitAssignment,
    listSubmissions,
    gradeSubmission,
  };
})(window);
