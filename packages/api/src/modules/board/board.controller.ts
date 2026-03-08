import { Request, Response } from "express";
import { Board } from "./board.model";
import { Snapshot } from "./snapshot.model";
import mongoose from "mongoose";

//createboard
export const createBoard = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title } = req.body;

    const board = await Board.create({
      ownerId: userId,
      title: title?.trim() || "Untitled Board",
    });

    const snapshot = await Snapshot.create({
      boardId: board._id,
      opIndex: 0,
      snapshotJson: {
        strokes: [],
        shapes: [],
        notes: [],
      },
    });

    board.lastSnapshotId = snapshot._id;
    await board.save({ validateBeforeSave: false });

    res.status(201).json({
      success: true,
      data: board,
    });
  } catch (error) {
    console.error("Create board error:", error);

    res.status(500).json({
      success: false,
      message: "Error creating board",
    });
  }
};

//get Board by ID
export const getBoard = async (req: Request, res: Response) => {
  try {
    const boardId = req.params.id;
    const userId = req.user!.id;

    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid board ID",
      });
    }

    const board = await Board.findOne({
      _id: boardId,
      ownerId: userId,
    }).lean();

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    res.json({
      success: true,
      data: board,
    });
  } catch (error) {
    console.error("Get board error:", error);

    res.status(500).json({
      success: false,
      message: "Error fetching board",
    });
  }
};

//get My Boards
export const getMyBoards = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const boards = await Board.find({
      ownerId: userId,
    })
      .select("_id title visibility createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: boards,
    });
  } catch (error) {
    console.error("Get boards error:", error);

    res.status(500).json({
      success: false,
      message: "Error fetching boards",
    });
  }
};

//Delete board
export const deleteBoard = async (req: Request, res: Response) => {
  try {
    const boardId = req.params.id;
    const userId = req.user!.id;

    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid board ID",
      });
    }

    const board = await Board.findOneAndDelete({
      _id: boardId,
      ownerId: userId,
    });

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    res.json({
      success: true,
      message: "Board deleted",
    });
  } catch (error) {
    console.error("Delete board error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting board",
    });
  }
};
