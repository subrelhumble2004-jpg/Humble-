
        "Appointment not found"
      );
    }

    await pool.query(
      `
      UPDATE appointments
      SET status = ?
      WHERE id = ?
      `,
      [status, req.params.id]
    );

    // Keep queue ticket status synchronized.
    let queueStatus = "waiting";

    if (status === "completed") {
      queueStatus = "completed";
    } else if (status === "cancelled") {
      queueStatus = "cancelled";
    } else if (status === "no_show") {
      queueStatus = "skipped";
    } else if (status === "confirmed" || status === "pending") {
      queueStatus = "waiting";
    }

    await pool.query(
      `
      UPDATE queue_tickets
      SET status = ?
      WHERE appointment_id = ?
      `,
      [queueStatus, req.params.id]
    );

    res.json({
      success: true,
      message: "Appointment status updated 
